import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const INN_REGEX = /^\d{10}$|^\d{12}$/;
const KPP_REGEX = /^\d{9}$/;
const OGRN_REGEX = /^\d{13}$|^\d{15}$/;
const BIK_REGEX = /^\d{9}$/;
const ACCOUNT_REGEX = /^\d{20}$/;

function validateOrgForm(form: Record<string, unknown>): string | null {
  const name = String(form?.name ?? "").trim();
  if (!name) return "Название организации обязательно";

  const inn = String(form?.inn ?? "").trim();
  if (!inn) return "ИНН обязателен";
  if (!INN_REGEX.test(inn)) return "ИНН — 10 цифр (юрлицо) или 12 цифр (ИП)";

  const ogrn = String(form?.ogrn ?? "").trim();
  if (!ogrn) return "ОГРН обязателен";
  if (!OGRN_REGEX.test(ogrn)) return "ОГРН — 13 цифр (юрлицо) или 15 цифр (ИП)";

  const kpp = form?.kpp ? String(form.kpp).trim() : null;
  if (kpp && !KPP_REGEX.test(kpp)) return "КПП — 9 цифр";

  const bik = form?.bank && typeof form.bank === "object" && form.bank !== null
    ? String((form.bank as Record<string, unknown>).bik ?? "").trim()
    : "";
  if (bik !== "" && !BIK_REGEX.test(bik)) return "БИК — 9 цифр";

  const checkingAccount = form?.bank && typeof form.bank === "object" && form.bank !== null
    ? String((form.bank as Record<string, unknown>).checkingAccount ?? "").trim()
    : "";
  if (checkingAccount !== "" && !ACCOUNT_REGEX.test(checkingAccount)) return "Расчётный счёт — 20 цифр";

  const correspondentAccount = form?.bank && typeof form.bank === "object" && form.bank !== null
    ? String((form.bank as Record<string, unknown>).correspondentAccount ?? "").trim()
    : "";
  if (correspondentAccount !== "" && !ACCOUNT_REGEX.test(correspondentAccount)) return "Корр. счёт — 20 цифр";

  return null;
}

serve(async (req) => {
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

  try {
    const body = await req.json();
    if (!body?.id || !UUID_RE.test(body.id)) {
      return new Response(JSON.stringify({ error: "Invalid id" }), {
        status: 400,
        headers: cors,
      });
    }

    const form = body?.form ?? body?.payload ?? null;
    if (!form) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: cors,
      });
    }

    const validationError = validateOrgForm(form);
    if (validationError) {
      return new Response(JSON.stringify({ error: validationError }), {
        status: 400,
        headers: cors,
      });
    }

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

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("id", body.id)
      .maybeSingle();
    if (!org) {
      return new Response(JSON.stringify({ error: "Доступ запрещён" }), {
        status: 403,
        headers: cors,
      });
    }

    const dbRow = {
      user_id: user.id,
      name: form.name,
      inn: form.inn,
      kpp: form.kpp || null,
      ogrn: form.ogrn || null,
      address: form.address || null,
      phone: form.phone || null,
      email: form.email || null,
      is_main: form.isMain ?? false,
      bank_bik: form.bank?.bik || null,
      bank_name: form.bank?.bankName || null,
      checking_account: form.bank?.checkingAccount || null,
      correspondent_account: form.bank?.correspondentAccount || null,
    };

    const { data, error } = await supabase
      .from("organizations")
      .update(dbRow)
      .eq("id", body.id)
      .select(
        "id,name,inn,kpp,ogrn,address,phone,email,is_main,bank_bik,bank_name,checking_account,correspondent_account",
      )
      .single();

    if (error) throw error;

    const out = data
      ? {
        id: data.id,
        name: data.name,
        inn: data.inn,
        kpp: data.kpp ?? "",
        ogrn: data.ogrn ?? "",
        address: data.address ?? "",
        phone: data.phone ?? "",
        email: data.email ?? "",
        isMain: data.is_main,
        bank: {
          bik: data.bank_bik ?? "",
          bankName: data.bank_name ?? "",
          checkingAccount: data.checking_account ?? "",
          correspondentAccount: data.correspondent_account ?? "",
        },
      }
      : null;

    return new Response(JSON.stringify({ ok: true, data: out }), {
      status: 200,
      headers: cors,
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: cors,
    });
  }
});

