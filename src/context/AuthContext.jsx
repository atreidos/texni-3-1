// ============================================================
// AuthContext — глобальное состояние авторизации
// Имитирует работу с бэкендом через моковые данные
// ============================================================

import { createContext, useContext, useState } from 'react';
import { mockUser } from '../data/mockData';

// Создаём контекст
const AuthContext = createContext(null);

// Провайдер — оборачивает всё приложение (см. main.jsx)
export function AuthProvider({ children }) {
  // isLoggedIn — авторизован ли пользователь сейчас
  // По умолчанию false — незарегистрированный пользователь
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // Имитация входа: устанавливаем моковые данные пользователя
  function login(email, password) {
    setIsLoggedIn(true);
    setUser(mockUser);
  }

  // Имитация регистрации
  function register(name, email, password) {
    setIsLoggedIn(true);
    setUser({ ...mockUser, name, email });
  }

  // Выход из системы
  function logout() {
    setIsLoggedIn(false);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Хук для удобного использования контекста в компонентах
export function useAuth() {
  return useContext(AuthContext);
}
