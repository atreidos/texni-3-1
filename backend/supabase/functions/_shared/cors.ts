/**
 * CORS headers for Edge Functions.
 * Set CORS_ALLOWED_ORIGINS in Supabase Secrets (comma-separated, e.g. "https://app.example.com,http://localhost:5173").
 * If unset or contains "*", allows any origin (dev/default).
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const env = Deno.env.get("CORS_ALLOWED_ORIGINS") || "*";
  const allowed = env.split(",").map((s) => s.trim()).filter(Boolean);
  if (allowed.length === 0 || allowed.includes("*")) {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Content-Type": "application/json",
    };
  }
  const origin = req.headers.get("Origin") || "";
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };
}
