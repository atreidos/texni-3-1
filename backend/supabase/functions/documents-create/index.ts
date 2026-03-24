import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { validation400One } from "../_shared/validation-response.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TYPE_VALID = /^(pdf|docx)$/i;

const MIME_PDF = "application/pdf";
const MIME_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MIME_ALLOWED = new Set([MIME_PDF, MIME_DOCX]);

function mimeMatchesType(mime: string, type: string): boolean {
  if (type === "pdf") return mime === MIME_PDF;
  if (type === "docx") return mime === MIME_DOCX;
  return false;
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
    const id = body?.id;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const type = typeof body?.type === "string" ? body.type.toLowerCase() : "";
    const mimeType = typeof body?.mime_type === "string" ? body.mime_type.trim() : "";
    const filePath = typeof body?.file_path === "string" ? body.file_path.trim() : "";
    const sizeBytes = body?.size_bytes;

    if (!id || !UUID_RE.test(id)) {
      return validation400One(cors, "id", "Некорректный идентификатор документа");
    }
    if (!name) {
      return validation400One(cors, "name", "Название документа обязательно");
    }
    if (!TYPE_VALID.test(type)) {
      return validation400One(cors, "type", "Тип должен быть pdf или docx");
    }
    if (mimeType && (!MIME_ALLOWED.has(mimeType) || !mimeMatchesType(mimeType, type))) {
      return validation400One(cors, "mime_type", "Неверный MIME-тип файла");
    }
    if (!filePath) {
      return validation400One(cors, "file_path", "Путь к файлу обязателен");
    }
    if (filePath.split("/")[0] !== user.id) {
      return validation400One(cors, "file_path", "Неверный путь к файлу");
    }
    const size = sizeBytes != null ? parseInt(String(sizeBytes), 10) : null;
    if (size != null && (isNaN(size) || size < 0)) {
      return validation400One(cors, "size_bytes", "Неверный размер файла");
    }

    const organizationId = body?.organization_id ?? null;
    if (organizationId != null && !UUID_RE.test(organizationId)) {
      return validation400One(cors, "organization_id", "Некорректный идентификатор организации");
    }

    if (organizationId) {
      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("id", organizationId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!org) {
        return validation400One(cors, "organization_id", "Организация не найдена");
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
