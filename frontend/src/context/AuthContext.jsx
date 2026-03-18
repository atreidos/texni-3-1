// ============================================================
// AuthContext — глобальное состояние авторизации
// Использует Supabase Auth + таблицу profiles
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // user — объект Supabase Auth (id, email, …)
  // profile — строка из таблицы profiles (name, phone, plan, …)
  // loading — идёт ли начальная проверка сессии
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Загружаем профиль из БД по userId (при ошибке профиль остаётся null, loading снимается)
  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error) setProfile(data);
    else setProfile(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Страховка: если через 8 с loading всё ещё true — снимаем, чтобы не зависнуть на белом экране
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      setLoading(false);
    }, 8000);

    // Восстанавливаем сессию при старте приложения
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (cancelled) return;

        // Если сессии нет — просто снимаем загрузку
        if (!session?.user) {
          setLoading(false);
          return;
        }

        try {
          // Пытаемся один раз обновить сессию при старте приложения
          const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();

          if (refreshError || !refreshed?.session?.user) {
            // Не удалось обновить — считаем, что сессии нет, очищаем состояние
            setUser(null);
            setProfile(null);
            setIsLoggedIn(false);
            setLoading(false);
            return;
          }

          const freshUser = refreshed.session.user;
          setUser(freshUser);
          setIsLoggedIn(true);
          await fetchProfile(freshUser.id);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          // На любой ошибке — сбрасываем состояние и снимаем загрузку
          setUser(null);
          setProfile(null);
          setIsLoggedIn(false);
          setLoading(false);
        }
      });

    // Подписка на изменения состояния авторизации (вход / выход / обновление токена)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (cancelled) return;
          if (session?.user) {
            setUser(session.user);
            setIsLoggedIn(true);
            await fetchProfile(session.user.id);
          } else {
            setUser(null);
            setProfile(null);
            setIsLoggedIn(false);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
    );

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Вход — бросает ошибку при неудаче
  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  // Регистрация — передаём name через user_meta_data,
  // триггер handle_new_user в БД создаст профиль автоматически
  async function register(name, email, password) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
  }

  // Выход
  async function logout() {
    await supabase.auth.signOut();
  }

  // Позволяет обновить profile в контексте после изменений в SettingsPage
  async function refreshProfile() {
    if (user?.id) await fetchProfile(user.id);
  }

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, user, profile, loading, login, register, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
