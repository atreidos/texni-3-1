/**
 * Структурированные JSON-логи для Edge Functions.
 * Отключение: секрет EDGE_STRUCTURED_LOGGING = false | 0 | no | off (регистр не важен).
 * Пустая/отсутствующая переменная — логирование включено.
 */

const DISABLED = new Set(["0", "false", "no", "off", ""]);

/** Ключи полей, значения которых в business/context не логируются (заменяются на [REDACTED]). */
const REDACT_KEYS = new Set([
  "password",
  "passwd",
  "pwd",
  "secret",
  "token",
  "authorization",
  "api_key",
  "apikey",
  "jwt",
  "refresh_token",
  "access_token",
  "service_role",
  "service_role_key",
  "dadata_api_key",
  "credit_card",
  "cvv",
]);

export function isStructuredLoggingEnabled(): boolean {
  const v = Deno.env.get("EDGE_STRUCTURED_LOGGING");
  if (v == null || v.trim() === "") return true;
  return !DISABLED.has(v.trim().toLowerCase());
}

function emit(record: Record<string, unknown>): void {
  if (!isStructuredLoggingEnabled()) return;
  console.log(JSON.stringify(record));
}

function sanitizeValue(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sanitizeValue);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (REDACT_KEYS.has(k.toLowerCase())) {
      out[k] = "[REDACTED]";
      continue;
    }
    out[k] = sanitizeValue(v);
  }
  return out;
}

/** Ошибка: полный текст и стек (без тел запросов и заголовков). */
export function logError(
  err: unknown,
  context?: Record<string, unknown>,
): void {
  if (!isStructuredLoggingEnabled()) return;
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack ?? null : null;
  const payload: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level: "error",
    type: "error",
    message,
    stack,
  };
  if (context && Object.keys(context).length > 0) {
    payload.context = sanitizeValue(context);
  }
  emit(payload);
}

/** Бизнес-событие (без секретов; вложенные поля с опасными именами маскируются). */
export function logBusiness(
  action: string,
  data: Record<string, unknown>,
  opts?: { function?: string },
): void {
  if (!isStructuredLoggingEnabled()) return;
  emit({
    ts: new Date().toISOString(),
    level: "info",
    type: "business",
    function: opts?.function,
    action,
    data: sanitizeValue(data) as Record<string, unknown>,
  });
}

const MUTATION_METHODS = new Set(["POST", "PATCH", "DELETE"]);

/**
 * Оборачивает обработчик запроса: после ответа логирует POST/PATCH/DELETE
 * (метод, path, статус, длительность). Не логирует тело и заголовки.
 */
export async function runWithHttpMutationLog(
  req: Request,
  functionName: string,
  handler: () => Promise<Response>,
): Promise<Response> {
  const start = performance.now();
  let res: Response;
  try {
    res = await handler();
  } catch (e) {
    logError(e, { function: functionName, phase: "handler_throw" });
    throw e;
  }
  const duration_ms = Math.round(performance.now() - start);
  const method = req.method;
  if (MUTATION_METHODS.has(method)) {
    const url = new URL(req.url);
    emit({
      ts: new Date().toISOString(),
      level: "info",
      type: "http_mutation",
      function: functionName,
      method,
      path: url.pathname + url.search,
      status: res.status,
      duration_ms,
    });
  }
  return res;
}
