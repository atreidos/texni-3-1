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

  // Загружаем профиль из БД по userId
  const fetchProfile = useCallback(async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
  }, []);

  useEffect(() => {
    // Восстанавливаем сессию при старте приложения
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setIsLoggedIn(true);
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Подписка на изменения состояния авторизации (вход / выход / обновление токена)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          setIsLoggedIn(true);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setIsLoggedIn(false);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
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
