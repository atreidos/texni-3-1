// ============================================================
// Supabase client — единственный экземпляр на всё приложение
// VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY берутся из .env
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Не найдены переменные окружения VITE_SUPABASE_URL и/или VITE_SUPABASE_ANON_KEY.\n' +
    'Создайте файл .env в корне проекта и заполните их.'
  );
}

// Запросы к API должны уходить на *.supabase.co, а не на localhost
if (!supabaseUrl.includes('supabase.co') || supabaseUrl.includes('localhost')) {
  throw new Error(
    'VITE_SUPABASE_URL должен указывать на проект Supabase (например https://xxxxx.supabase.co).\n' +
    'Сейчас: ' + (supabaseUrl || '(пусто)') + '\n' +
    'Возьмите URL в Supabase: проект → Settings → API → Project URL.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * POST в Edge Function с явным токеном (опционально).
 * Без token использует getSession(). С token — передаёт его в Authorization.
 * - при 401 → refreshSession() и повтор
 * - при ошибке refresh → signOut + редирект. При повторном 401 после refresh — только возврат ошибки (не signOut)
 * @param {string} functionName
 * @param {object} payload
 * @param {string} [explicitToken] - access_token из AuthContext (если есть)
 */
export async function callEdgeFunction(functionName, payload, explicitToken = null) {
  const url = supabaseUrl + '/functions/v1/' + functionName;

  async function attempt(useExplicitToken = true) {
    const token = (useExplicitToken && explicitToken)
      ? explicitToken
      : (await supabase.auth.getSession()).data?.session?.access_token;
    if (!token) {
      return { status: 401, data: null, error: { message: 'Not authenticated' } };
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify(payload),
    });
    const status = res.status;
    if (!res.ok) {
      const text = await res.text();
      let msg = status + ' ' + res.statusText;
      try {
        const j = JSON.parse(text);
        if (j?.error) msg = j.error;
        if (j?.message) msg = j.message;
      } catch (_) {}
      if (status === 403 && !msg.includes('Доступ запрещён')) {
        msg = 'Доступ запрещён';
      }
      return { status, data: null, error: { message: msg } };
    }
    const data = await res.json();
    return { status, data, error: null };
  }

  let { status, data, error } = await attempt();
  if (status !== 401) return { data, error, status };

  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError || !refreshed?.session) {
    await supabase.auth.signOut({ scope: 'global' });
    window.location.assign('/auth/login');
    return { data: null, error: error || { message: 'Сессия истекла, войдите снова.' } };
  }

  ({ status, data, error } = await attempt(false)); // retry with fresh token from session
  if (status === 401) {
    // Refresh прошёл, но повторный запрос снова 401 — возможна ошибка конфигурации
    // (JWT gateway). Не делаем signOut — возвращаем ошибку, чтобы UI показал её.
    return { data: null, error: error || { message: 'Ошибка доступа. Проверьте настройки проекта (Edge Functions: --no-verify-jwt).' }, status: 401 };
  }

  return { data, error, status };
}

/**
 * Вызов Edge Function через supabase.functions.invoke() с телом запроса.
 * Клиент Supabase сам подставляет access_token — избегаем 401 из-за ручной передачи.
 * @param {string} functionName - имя функции, например 'dadata-find-party'
 * @param {object} body - тело запроса (POST)
 * @returns {{ data: unknown, error: { message: string } | null, status?: number }}
 */
export async function invokeEdgeFunction(functionName, body = {}) {
  function toError(obj) {
    if (!obj) return { message: 'Неизвестная ошибка' };
    if (typeof obj === 'string') return { message: obj };
    return { message: obj.message || obj.error || 'Ошибка запроса' };
  }

  let { data, error } = await supabase.functions.invoke(functionName, { body });
  if (!error) return { data, error: null, status: 200 };

  const status = error?.context?.status;
  if (status === 401) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshed?.session) {
      await supabase.auth.signOut({ scope: 'global' });
      window.location.assign('/auth/login');
      return { data: null, error: toError(error) };
    }
    ({ data, error } = await supabase.functions.invoke(functionName, { body }));
    if (!error) return { data, error: null, status: 200 };
    if (error?.context?.status === 401) {
      return { data: null, error: toError(error), status: 401 };
    }
  }

  return { data: null, error: toError(error), status };
}

/**
 * Вызов read-only Edge Function через supabase.functions.invoke().
 * Клиент Supabase сам подставляет текущий access_token — избегаем 401 из-за ручной передачи.
 * @param {string} functionName - имя функции, например 'profile-get'
 */
export async function fetchFromEdge(functionName) {
  function toError(obj) {
    if (!obj) return { message: 'Неизвестная ошибка' };
    if (typeof obj === 'string') return { message: obj };
    return { message: obj.message || obj.error || 'Ошибка запроса' };
  }

  let { data, error } = await supabase.functions.invoke(functionName, { body: {} });
  if (!error) return { data, error: null };

  const status = error?.context?.status;
  if (status === 401) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshed?.session) {
      await supabase.auth.signOut({ scope: 'global' });
      window.location.assign('/auth/login');
      return { data: null, error: toError(error) };
    }
    ({ data, error } = await supabase.functions.invoke(functionName, { body: {} }));
    if (!error) return { data, error: null };
    if (error?.context?.status === 401) {
      return { data: null, error: toError(error) };
    }
  }

  return { data: null, error: toError(error) };
}
