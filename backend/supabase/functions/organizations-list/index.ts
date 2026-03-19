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

  if (req.method !== "GET") {
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

    const { data, error } = await supabase
      .from("organizations")
      .select(
        "id,name,inn,kpp,ogrn,address,phone,email,is_main,bank_bik,bank_name,checking_account,correspondent_account",
      )
      .eq("user_id", user.id)
      .order("is_main", { ascending: false });

    if (error) throw error;

    const out = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      inn: row.inn,
      kpp: row.kpp ?? "",
      ogrn: row.ogrn ?? "",
      address: row.address ?? "",
      phone: row.phone ?? "",
      email: row.email ?? "",
      isMain: row.is_main,
      bank: {
        bik: row.bank_bik ?? "",
        bankName: row.bank_name ?? "",
        checkingAccount: row.checking_account ?? "",
        correspondentAccount: row.correspondent_account ?? "",
      },
    }));

    return new Response(JSON.stringify({ data: out }), {
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

