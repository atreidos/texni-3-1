import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { logBusiness, logError, runWithHttpMutationLog } from "../_shared/logger.ts";
import { validation400One } from "../_shared/validation-response.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) =>
  runWithHttpMutationLog(req, "documents-delete", async () => {
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
      if (body?.id === undefined || !UUID_RE.test(body.id)) {
        return validation400One(cors, "id", "Некорректный идентификатор документа");
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

      const { data: doc } = await supabase
        .from("documents")
        .select("id, file_path")
        .eq("id", body.id)
        .maybeSingle();
      if (!doc) {
        return new Response(JSON.stringify({ error: "Доступ запрещён" }), {
          status: 403,
          headers: cors,
        });
      }

      if (doc.file_path) {
        await supabase.storage.from("documents").remove([doc.file_path]);
      }

      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", body.id);

      if (error) throw error;

      logBusiness(
        "document_deleted",
        { userId: user.id, documentId: body.id },
        { function: "documents-delete" },
      );

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: cors,
      });
    } catch (e) {
      logError(e, { function: "documents-delete" });
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: cors,
      });
    }
  }));

