// supabase/functions/create-payment/index.ts
// Edge Function to insert payment data into the `payments` table.
// Uses the Supabase `service_role` key for privileged database writes.
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { validation400 } from "../_shared/validation-response.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

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
  try {
    const body = await req.json();
    const {
      user_id,
      plan,
      amount,
      status = "success",
      paid_at = new Date().toISOString(),
    } = body ?? {};

    const fieldErrors: { field: string; message: string }[] = [];
    if (!user_id) {
      fieldErrors.push({ field: "user_id", message: "Поле user_id обязательно" });
    }
    if (!plan) {
      fieldErrors.push({ field: "plan", message: "Поле plan обязательно" });
    }
    if (typeof amount !== "number") {
      fieldErrors.push({ field: "amount", message: "Поле amount должно быть числом" });
    }
    if (fieldErrors.length > 0) {
      return validation400(cors, fieldErrors);
    }

    const { error } = await supabase.from("payments").insert([
      {
        user_id,
        plan,
        amount,
        status,
        paid_at,
      },
    ]);
    if (error) {
      console.error("payments insert error", error);
      return new Response(
        JSON.stringify({ error: "Не удалось сохранить платёж" }),
        {
          status: 400,
          headers: cors,
        },
      );
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: cors,
    });
  } catch (e) {
    console.error("create-payment function error", e);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: cors,
    });
  }
});
