// supabase/functions/create-payment/index.ts
// Edge Function для безопасного создания записей в таблице `payments`.
// Работает только с service_role ключом (только на бэкенде Supabase).
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Эти переменные задаются в настройках проекта Supabase (Project > Settings > API / Functions)
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// service_role используется только здесь, на Edge Function, на фронт он не попадает
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  try {
    // TODO: здесь обычно проверяется подпись/секрет от платёжного провайдера (Stripe/YooKassa/...)
    const body = await req.json();
    // Ожидаемые поля. В реальном проекте лучше сделать строгую схему и валидацию.
    const {
      user_id,
      plan,
      amount,
      status = "success",
      paid_at = new Date().toISOString(),
    } = body ?? {};
    if (!user_id || !plan || typeof amount !== "number") {
      return new Response("Invalid payload", { status: 400 });
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
      return new Response(error.message, { status: 400 });
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-payment function error", e);
    return new Response("Internal Server Error", { status: 500 });
  }
});