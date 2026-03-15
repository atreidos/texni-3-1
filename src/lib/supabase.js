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
 * Вставка организации через прямой fetch (обход клиента для отладки).
 * Использует текущую сессию для Authorization.
 */
export async function insertOrganizationViaFetch(payload) {
  const { data: { session } } = await supabase.auth.getSession();
  const url = supabaseUrl + '/rest/v1/organizations';
  const headers = {
    'Content-Type': 'application/json',
    'apikey': supabaseAnonKey,
    'Authorization': 'Bearer ' + (session?.access_token || supabaseAnonKey),
    'Prefer': 'return=minimal',
  };
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
  if (!res.ok) {
    const text = await res.text();
    let msg = res.status + ' ' + res.statusText;
    try {
      const j = JSON.parse(text);
      if (j?.message) msg = j.message;
      if (j?.details) msg += ': ' + j.details;
    } catch (_) {}
    return { error: { message: msg } };
  }
  return { error: null };
}
