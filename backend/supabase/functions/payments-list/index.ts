import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { logError, runWithHttpMutationLog } from "../_shared/logger.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

serve(async (req) =>
  runWithHttpMutationLog(req, "payments-list", async () => {
    const cors = getCorsHeaders(req);
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (req.method !== "GET" && req.method !== "POST") {
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

      const { data, error } = await supabase
        .from("payments")
        .select("id,paid_at,created_at,plan,amount,status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const out = (data || []).map((row: any) => ({
        id: row.id,
        paidAt: row.paid_at ?? null,
        createdAt: row.created_at ?? null,
        plan: row.plan,
        amount: row.amount,
        status: row.status,
      }));

      return new Response(JSON.stringify({ data: out }), {
        status: 200,
        headers: cors,
      });
    } catch (e) {
      logError(e, { function: "payments-list" });
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: cors,
      });
    }
  }));

