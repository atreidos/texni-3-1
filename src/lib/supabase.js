// ============================================================
// Supabase client — единственный экземпляр на всё приложение
// VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY берутся из .env
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Не найдены переменные окружения VITE_SUPABASE_URL и/или VITE_SUPABASE_ANON_KEY.\n' +
    'Создайте файл .env в корне проекта и заполните их.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
