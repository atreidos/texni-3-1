// ============================================================
// dadata-find-party — прокси к DaData API для поиска организации
// Поддерживает: поиск по ИНН (findById) и по названию (suggest/party).
// Вызывается только авторизованными пользователями (JWT).
// API-ключ DaData хранится в Supabase Secrets (DADATA_API_KEY).
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

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

serve(async (req) => {
  const cors = getCorsHeaders(req);
  const requestId = crypto.randomUUID().slice(0, 8);
  const log = (msg: string, data?: unknown) => {
    console.log(`[dadata-find-party ${requestId}] ${msg}`, data ?? "");
  };

  log("Request received", { method: req.method });

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
    log("Unauthorized: no Bearer token");
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

  log("Verifying JWT...");
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(jwt);
    log("Auth result", { hasUser: !!user, error: userError?.message });
    if (userError || !user) {
      log("Unauthorized: invalid or missing user", { userError: userError?.message });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: cors,
      });
    }
  } catch (e) {
    log("Auth check error", e);
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: cors,
    });
  }

  let body: { inn?: string; query?: string };
  try {
    body = await req.json();
  } catch {
    log("Invalid JSON body");
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      status: 400,
      headers: cors,
    });
  }

  const inn = String(body?.inn ?? "").trim();
  const query = String(body?.query ?? "").trim();
  log("Request", { inn, query });

  const apiKey = Deno.env.get("DADATA_API_KEY");
  if (!apiKey) {
    log("DaData not configured: DADATA_API_KEY missing");
    return new Response(JSON.stringify({ error: "DaData не настроен" }), {
      status: 500,
      headers: cors,
    });
  }

  const useInn = inn && INN_REGEX.test(inn);
  const useQuery = query.length >= 2 && !INN_REGEX.test(query.replace(/\s/g, ""));

  if (!useInn && !useQuery) {
    log("Invalid request: need inn (10/12 digits) or query (>=2 chars)");
    return new Response(JSON.stringify({ error: "Укажите ИНН (10 или 12 цифр) или название (минимум 2 символа)" }), {
      status: 400,
      headers: cors,
    });
  }

  if (useInn) {
    if (!validateInnChecksum(inn)) {
      log("INN checksum failed", { inn });
      return new Response(JSON.stringify({ error: "ИНН содержит ошибку (алгоритм ФНС)" }), {
        status: 400,
        headers: cors,
      });
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DADATA_TIMEOUT_MS);

  const dadataUrl = useInn ? DADATA_FIND_BY_ID_URL : DADATA_SUGGEST_URL;
  const dadataBody = useInn ? { query: inn } : { query, count: 1 };

  try {
    log("DaData request", { url: dadataUrl, body: dadataBody });
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

    log("DaData response", { status: dadataRes.status });

    if (dadataRes.status === 401) {
      log("DaData 401: invalid API key");
      return new Response(JSON.stringify({ error: "Ошибка доступа к DaData" }), {
        status: 502,
        headers: cors,
      });
    }

    if (dadataRes.status === 429) {
      log("DaData 429: rate limit exceeded");
      return new Response(JSON.stringify({ error: "Превышен лимит запросов. Попробуйте позже" }), {
        status: 502,
        headers: cors,
      });
    }

    if (dadataRes.status >= 500) {
      const text = await dadataRes.text();
      log("DaData 5xx", { status: dadataRes.status, body: text.slice(0, 200) });
      return new Response(JSON.stringify({ error: "Сервис временно недоступен" }), {
        status: 502,
        headers: cors,
      });
    }

    const dadataJson = await dadataRes.json();
    log("DaData response body", dadataJson);

    const suggestions = dadataJson?.suggestions ?? [];
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
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

    log("Response success", { hasWarnings: (mapped._warnings as string[])?.length > 0 });

    return new Response(JSON.stringify({ ok: true, data: out }), {
      status: 200,
      headers: cors,
    });
  } catch (e) {
    clearTimeout(timeoutId);
    const isAbort = e instanceof Error && e.name === "AbortError";
    const isTimeout = isAbort || /timeout|aborted/i.test(String(e));
    log("DaData request failed", { error: String(e), isTimeout });

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
});
