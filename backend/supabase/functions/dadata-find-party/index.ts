// ============================================================
// dadata-find-party — прокси к DaData API для поиска организации
// Поддерживает: поиск по ИНН (findById) и по названию (suggest/party).
// Вызывается только авторизованными пользователями (JWT).
// API-ключ DaData хранится в Supabase Secrets (DADATA_API_KEY).
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { logBusiness, logError, runWithHttpMutationLog } from "../_shared/logger.ts";
import { validation400One } from "../_shared/validation-response.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const INN_REGEX = /^\d{10}$|^\d{12}$/;
const DADATA_FIND_BY_ID_URL = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party";
const DADATA_SUGGEST_URL = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party";
const DADATA_TIMEOUT_MS = 7000;

/**
 * Проверка контрольной суммы ИНН по алгоритму ФНС.
 * ИНН 10 цифр: коэффициенты (2,4,10,3,5,9,4,6,8,0), 10-я цифра — контрольная.
 * ИНН 12 цифр: две контрольные цифры на позициях 11 и 12.
 */
function validateInnChecksum(inn: string): boolean {
  const digits = inn.split("").map(Number);
  if (digits.length === 10) {
    const sum =
      2 * digits[0] + 4 * digits[1] + 10 * digits[2] + 3 * digits[3] +
      5 * digits[4] + 9 * digits[5] + 4 * digits[6] + 6 * digits[7] + 8 * digits[8];
    const c1 = (sum % 11) % 10;
    return digits[9] === c1;
  }
  if (digits.length === 12) {
    const sum1 =
      7 * digits[0] + 2 * digits[1] + 4 * digits[2] + 10 * digits[3] +
      3 * digits[4] + 5 * digits[5] + 9 * digits[6] + 4 * digits[7] + 6 * digits[8] + 8 * digits[9];
    const c1 = (sum1 % 11) % 10;
    if (digits[10] !== c1) return false;
    const sum2 =
      3 * digits[0] + 7 * digits[1] + 2 * digits[2] + 4 * digits[3] +
      10 * digits[4] + 3 * digits[5] + 5 * digits[6] + 9 * digits[7] + 4 * digits[8] + 6 * digits[9] + 8 * digits[10];
    const c2 = (sum2 % 11) % 10;
    return digits[11] === c2;
  }
  return false;
}

// address в suggest может быть { value?: string } или вложенный объект
interface DaDataParty {
  data?: {
    type?: "LEGAL" | "INDIVIDUAL";
    name?: { short_with_opf?: string; full?: string };
    inn?: string;
    kpp?: string;
    ogrn?: string;
    address?: { value?: string } | string;
    phones?: Array<{ value?: string }>;
    emails?: Array<{ value?: string }>;
    state?: { status?: string };
    invalid?: boolean;
  };
}

function mapDaDataToForm(d: DaDataParty): Record<string, unknown> {
  const data = d?.data;
  if (!data) return {};

  const isIndividual = data.type === "INDIVIDUAL";
  const name = isIndividual
    ? (data.name?.full ?? "")
    : (data.name?.short_with_opf ?? "");

  const addr = data.address;
  const addressStr = typeof addr === "string" ? addr : addr?.value ?? "";
  return {
    name,
    inn: data.inn ?? "",
    kpp: isIndividual ? "" : (data.kpp ?? ""),
    ogrn: data.ogrn ?? "",
    address: addressStr,
    phone: data.phones?.[0]?.value ?? "",
    email: data.emails?.[0]?.value ?? "",
    bank: { bik: "", bankName: "", checkingAccount: "", correspondentAccount: "" },
    _warnings: [] as string[],
    _rawState: data.state?.status,
    _rawInvalid: data.invalid,
  };
}

function addWarnings(mapped: Record<string, unknown>): Record<string, unknown> {
  const warnings: string[] = [];
  if (mapped._rawState && mapped._rawState !== "ACTIVE") {
    warnings.push("Организация не действует");
  }
  if (mapped._rawInvalid === true) {
    warnings.push("В ЕГРЮЛ есть сведения о недостоверности");
  }
  mapped._warnings = warnings;
  delete mapped._rawState;
  delete mapped._rawInvalid;
  return mapped;
}

serve(async (req) =>
  runWithHttpMutationLog(req, "dadata-find-party", async () => {
    const cors = getCorsHeaders(req);

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: cors,
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: cors,
      });
    }
    const jwt = authHeader.replace("Bearer ", "");

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let userId: string | undefined;
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser(jwt);
      if (userError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: cors,
        });
      }
      userId = user.id;
    } catch (e) {
      logError(e, { function: "dadata-find-party", phase: "auth" });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: cors,
      });
    }

    let body: { inn?: string; query?: string };
    try {
      body = await req.json();
    } catch {
      return validation400One(cors, "body", "Некорректный JSON в теле запроса");
    }

    const inn = String(body?.inn ?? "").trim();
    const query = String(body?.query ?? "").trim();

    const apiKey = Deno.env.get("DADATA_API_KEY");
    if (!apiKey) {
      logError(new Error("DADATA_API_KEY missing"), { function: "dadata-find-party" });
      return new Response(JSON.stringify({ error: "DaData не настроен" }), {
        status: 500,
        headers: cors,
      });
    }

    const useInn = inn && INN_REGEX.test(inn);
    const useQuery = query.length >= 2 && !INN_REGEX.test(query.replace(/\s/g, ""));

    if (!useInn && !useQuery) {
      return validation400One(
        cors,
        "search",
        "Укажите ИНН (10 или 12 цифр) или название (минимум 2 символа)",
      );
    }

    if (useInn) {
      if (!validateInnChecksum(inn)) {
        return validation400One(cors, "inn", "ИНН содержит ошибку (алгоритм ФНС)");
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DADATA_TIMEOUT_MS);

    const dadataUrl = useInn ? DADATA_FIND_BY_ID_URL : DADATA_SUGGEST_URL;
    const dadataBody = useInn ? { query: inn } : { query, count: 1 };

    try {
      const dadataRes = await fetch(dadataUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Token ${apiKey}`,
        },
        body: JSON.stringify(dadataBody as Record<string, unknown>),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (dadataRes.status === 401) {
        logError(new Error("DaData 401"), { function: "dadata-find-party", phase: "dadata_http" });
        return new Response(JSON.stringify({ error: "Ошибка доступа к DaData" }), {
          status: 502,
          headers: cors,
        });
      }

      if (dadataRes.status === 429) {
        return new Response(JSON.stringify({ error: "Превышен лимит запросов. Попробуйте позже" }), {
          status: 502,
          headers: cors,
        });
      }

      if (dadataRes.status >= 500) {
        const text = await dadataRes.text();
        logError(new Error(`DaData ${dadataRes.status}: ${text.slice(0, 200)}`), {
          function: "dadata-find-party",
          phase: "dadata_http",
        });
        return new Response(JSON.stringify({ error: "Сервис временно недоступен" }), {
          status: 502,
          headers: cors,
        });
      }

      const dadataJson = await dadataRes.json();

      const suggestions = dadataJson?.suggestions ?? [];
      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        logBusiness(
          "dadata_party_lookup",
          { userId, mode: useInn ? "by_inn" : "by_name", found: false },
          { function: "dadata-find-party" },
        );
        return new Response(JSON.stringify({ ok: true, data: null }), {
          status: 200,
          headers: cors,
        });
      }

      const first = suggestions[0] as DaDataParty;
      let mapped = mapDaDataToForm(first);
      mapped = addWarnings(mapped);

      const out = {
        name: mapped.name,
        inn: mapped.inn,
        kpp: mapped.kpp,
        ogrn: mapped.ogrn,
        address: mapped.address,
        phone: mapped.phone,
        email: mapped.email,
        bank: mapped.bank,
        warnings: mapped._warnings,
      };

      logBusiness(
        "dadata_party_lookup",
        {
          userId,
          mode: useInn ? "by_inn" : "by_name",
          found: true,
          warningCount: Array.isArray(mapped._warnings) ? (mapped._warnings as string[]).length : 0,
        },
        { function: "dadata-find-party" },
      );

      return new Response(JSON.stringify({ ok: true, data: out }), {
        status: 200,
        headers: cors,
      });
    } catch (e) {
      clearTimeout(timeoutId);
      const isAbort = e instanceof Error && e.name === "AbortError";
      const isTimeout = isAbort || /timeout|aborted/i.test(String(e));
      logError(e, { function: "dadata-find-party", phase: "dadata_fetch", isTimeout });

      if (isTimeout) {
        return new Response(JSON.stringify({ error: "Сервис временно недоступен" }), {
          status: 502,
          headers: cors,
        });
      }

      return new Response(JSON.stringify({ error: "Сервис временно недоступен" }), {
        status: 502,
        headers: cors,
      });
    }
  }));
