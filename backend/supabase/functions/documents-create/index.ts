import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TYPE_VALID = /^(pdf|docx)$/i;

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
    const id = body?.id;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const type = typeof body?.type === "string" ? body.type.toLowerCase() : "";
    const filePath = typeof body?.file_path === "string" ? body.file_path.trim() : "";
    const sizeBytes = body?.size_bytes;

    if (!id || !UUID_RE.test(id)) {
      return new Response(JSON.stringify({ error: "Invalid id" }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }
    if (!name) {
      return new Response(JSON.stringify({ error: "Название документа обязательно" }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }
    if (!TYPE_VALID.test(type)) {
      return new Response(JSON.stringify({ error: "Тип должен быть pdf или docx" }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }
    if (!filePath) {
      return new Response(JSON.stringify({ error: "Путь к файлу обязателен" }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }
    if (filePath.split("/")[0] !== user.id) {
      return new Response(JSON.stringify({ error: "Неверный путь к файлу" }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }
    const size = sizeBytes != null ? parseInt(String(sizeBytes), 10) : null;
    if (size != null && (isNaN(size) || size < 0)) {
      return new Response(JSON.stringify({ error: "Неверный размер файла" }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const organizationId = body?.organization_id ?? null;
    if (organizationId != null && !UUID_RE.test(organizationId)) {
      return new Response(JSON.stringify({ error: "Invalid organization_id" }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    if (organizationId) {
      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("id", organizationId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!org) {
        return new Response(JSON.stringify({ error: "Организация не найдена" }), {
          status: 400,
          headers: CORS_HEADERS,
        });
      }
    }

    const { error } = await supabase.from("documents").insert({
      id,
      user_id: user.id,
      organization_id: organizationId || null,
      name,
      type,
      status: "draft",
      file_path: filePath,
      size_bytes: size,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ data: { id } }), {
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
