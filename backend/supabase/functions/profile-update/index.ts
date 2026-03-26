import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { logBusiness, logError, runWithHttpMutationLog } from "../_shared/logger.ts";
import { type FieldError, validation400 } from "../_shared/validation-response.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s+()-]*$/;
const MAX_NAME_LEN = 200;
const MAX_EMAIL_LEN = 254;
const MAX_PHONE_LEN = 30;

function collectProfileErrors(body: { name?: string; email?: string; phone?: string | null }): FieldError[] {
  const errors: FieldError[] = [];
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const phone = body?.phone == null ? null : String(body.phone).trim();

  if (!name) errors.push({ field: "name", message: "Имя обязательно" });
  else if (name.length > MAX_NAME_LEN) errors.push({ field: "name", message: "Имя слишком длинное" });

  if (!email) errors.push({ field: "email", message: "Email обязателен" });
  else if (email.length > MAX_EMAIL_LEN) {
    errors.push({ field: "email", message: "Email слишком длинный" });
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push({ field: "email", message: "Неверный формат email" });
  }

  if (phone !== null && phone !== "") {
    if (phone.length > MAX_PHONE_LEN) {
      errors.push({ field: "phone", message: "Телефон слишком длинный" });
    } else if (!PHONE_REGEX.test(phone)) {
      errors.push({ field: "phone", message: "Неверный формат телефона" });
    }
  }

  return errors;
}

serve(async (req) =>
  runWithHttpMutationLog(req, "profile-update", async () => {
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

      const body = await req.json();
      const profileErrors = collectProfileErrors(body);
      if (profileErrors.length > 0) {
        return validation400(cors, profileErrors);
      }

      const name = (body?.name ?? "").trim();
      const email = (body?.email ?? "").trim();
      const phone = body?.phone == null ? null : (String(body.phone).trim() || null);

      const { error } = await supabase
        .from("profiles")
        .update({
          name,
          email,
          phone: phone || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      logBusiness(
        "profile_updated",
        { userId: user.id },
        { function: "profile-update" },
      );

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: cors,
      });
    } catch (e) {
      logError(e, { function: "profile-update" });
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: cors,
      });
    }
  }));

