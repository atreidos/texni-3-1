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
 * Вставка организации через прямой fetch с обработкой 401:
 * - первый запрос с текущим access_token
 * - при 401 → один refreshSession() и повтор запроса
 * - при повторном 401 или ошибке refresh → signOut + редирект на /auth/login
 */
export async function insertOrganizationViaFetch(payload) {
  const url = supabaseUrl + '/rest/v1/organizations';

  async function attempt() {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || supabaseAnonKey;
    const headers = {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: 'Bearer ' + token,
      Prefer: 'return=minimal',
    };
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
    const status = res.status;
    if (!res.ok) {
      const text = await res.text();
      let msg = status + ' ' + res.statusText;
      try {
        const j = JSON.parse(text);
        if (j?.message) msg = j.message;
        if (j?.details) msg += ': ' + j.details;
      } catch (_) {}
      return { status, error: { message: msg } };
    }
    return { status, error: null };
  }

  // Первая попытка
  let { status, error } = await attempt();
  if (status !== 401) {
    return { error };
  }

  // 401 → пробуем один раз обновить сессию
  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError || !refreshed?.session) {
    // refresh не удался — выходим и отправляем на логин
    await supabase.auth.signOut();
    window.location.assign('/auth/login');
    return { error: error || { message: 'Сессия истекла, войдите снова.' } };
  }

  // Вторая попытка с обновлённой сессией
  ({ status, error } = await attempt());
  if (status === 401) {
    // Повторный 401 — очищаем сессию и просим перелогиниться
    await supabase.auth.signOut();
    window.location.assign('/auth/login');
    return { error: error || { message: 'Сессия истекла, войдите снова.' } };
  }

  return { error };
}
