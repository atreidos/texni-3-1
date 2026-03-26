// ============================================================
// AuthContext — глобальное состояние авторизации
// Использует Supabase Auth + таблицу profiles
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setUser as sentrySetUser } from '@sentry/react';
import { supabase, fetchFromEdge } from '../lib/supabase';

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
const sentryUserSyncEnabled = Boolean(sentryDsn && String(sentryDsn).trim());

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // user — объект Supabase Auth (id, email, …)
  // profile — строка из таблицы profiles (name, phone, plan, …)
  // loading — идёт ли начальная проверка сессии
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Загружаем профиль из БД (при ошибке профиль остаётся null).
  // token — опционально, если только что получили из refreshSession (избегаем гонки с getSession).
  const fetchProfile = useCallback(async (token) => {
    const { data: res, error } = await fetchFromEdge('profile-get');
    if (error) {
      setProfile(null);
      return;
    }
    // Edge возвращает { data: profile }
    const data = res?.data ?? res;
    if (!data) {
      setProfile(null);
      return;
    }

    setProfile({
      ...data,
      planExpires: data.planExpires ?? data.plan_expires ?? null,
      docsUsed: data.docsUsed ?? data.docs_used ?? 0,
      docsLimit: data.docsLimit ?? data.docs_limit ?? 0,
      updatedAt: data.updatedAt ?? data.updated_at ?? null,
      createdAt: data.createdAt ?? data.created_at ?? null,
    });
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
            setAccessToken(null);
            setIsLoggedIn(false);
            setLoading(false);
            return;
          }

          const freshUser = refreshed.session.user;
          setUser(freshUser);
          setAccessToken(refreshed.session.access_token);
          setIsLoggedIn(true);
          await fetchProfile(refreshed.session.access_token);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          // На любой ошибке — сбрасываем состояние и снимаем загрузку
          setUser(null);
          setProfile(null);
          setAccessToken(null);
          setIsLoggedIn(false);
          setLoading(false);
        }
      });

    // Подписка на изменения состояния авторизации (вход / выход / обновление токена)
    // Важно: не вызывать await Supabase-методов внутри callback — приводит к deadlock
    // (см. https://supabase.com/docs/reference/javascript/auth-onauthstatechange)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (cancelled) return;
        if (session?.user) {
          setUser(session.user);
          setAccessToken(session.access_token);
          setIsLoggedIn(true);
          setTimeout(() => fetchProfile(session.access_token), 0);
        } else {
          setUser(null);
          setProfile(null);
          setAccessToken(null);
          setIsLoggedIn(false);
        }
        setLoading(false);
      }
    );

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sentry: только uuid пользователя (без email) — для сгруппированных событий
  useEffect(() => {
    if (!sentryUserSyncEnabled) return;
    if (user?.id) {
      sentrySetUser({ id: user.id });
    } else {
      sentrySetUser(null);
    }
  }, [user?.id]);

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

  // Выход (scope: 'global' — выход на всех устройствах/вкладках)
  async function logout() {
    await supabase.auth.signOut({ scope: 'global' });
  }

  // Позволяет обновить profile в контексте после изменений в SettingsPage
  async function refreshProfile() {
    if (user?.id) await fetchProfile(accessToken);
  }

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, user, profile, accessToken, loading, login, register, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
