import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: CORS_HEADERS,
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: CORS_HEADERS,
    });
  }
  const jwt = authHeader.replace("Bearer ", "");

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: CORS_HEADERS,
      });
    }

    const body = await req.json();
    const form = body?.form ?? body;
    if (!form) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: CORS_HEADERS,
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
      .insert([dbRow])
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
      headers: CORS_HEADERS,
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
});

