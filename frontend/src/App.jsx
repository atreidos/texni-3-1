// ============================================================
// App.jsx — корневой компонент с роутингом
//
// Маршруты:
//   /                          → авторизованный: редирект на /dashboard, иначе LandingPage
//   /editor                    → EditorPage
//   /pricing                   → PricingPage
//   /auth/login                → LoginPage
//   /auth/register             → RegisterPage
//   /auth/forgot-password      → ForgotPasswordPage
//   /dashboard                 → DashboardPage (защищённый)
//   /dashboard/documents       → DocumentsPage
//   /dashboard/organizations   → OrganizationsPage
//   /dashboard/signature       → SignaturePage
//   /dashboard/billing         → BillingPage
//   /dashboard/settings        → SettingsPage
//   *                          → NotFoundPage
// ============================================================

import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from './context/AuthContext';

// Публичные страницы
import LandingPage from './pages/LandingPage';
import EditorPage from './pages/EditorPage';
import PricingPage from './pages/PricingPage';
import NotFoundPage from './pages/NotFoundPage';

// Страницы авторизации
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Страницы личного кабинета
import DashboardPage from './pages/dashboard/DashboardPage';
import DocumentsPage from './pages/dashboard/DocumentsPage';
import OrganizationsPage from './pages/dashboard/OrganizationsPage';
import SignaturePage from './pages/dashboard/SignaturePage';
import BillingPage from './pages/dashboard/BillingPage';
import SettingsPage from './pages/dashboard/SettingsPage';

// Главная: для авторизованного — редирект на Обзор, иначе лендинг
function LandingOrRedirect() {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (isLoggedIn) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

// Экран загрузки при проверке сессии (вместо белого экрана)
function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      <p className="text-slate-500">Проверка сессии...</p>
    </div>
  );
}

// Компонент-обёртка для защищённых маршрутов
// Пока идёт проверка сессии — показываем экран загрузки, не редиректим
// Ждём accessToken, чтобы не рендерить страницы до готовности (избегаем 401)
function PrivateRoute({ children }) {
  const { isLoggedIn, loading, accessToken } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (isLoggedIn && !accessToken) return <AuthLoadingScreen />;
  return isLoggedIn ? children : <Navigate to="/auth/login" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Главная: авторизованный → /dashboard (Обзор), иначе лендинг */}
      <Route path="/" element={<LandingOrRedirect />} />
      <Route path="/editor" element={<EditorPage />} />
      <Route path="/pricing" element={<PricingPage />} />

      {/* Авторизация */}
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

      {/* Личный кабинет — только для авторизованных */}
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/dashboard/documents" element={<PrivateRoute><DocumentsPage /></PrivateRoute>} />
      <Route path="/dashboard/organizations" element={<PrivateRoute><OrganizationsPage /></PrivateRoute>} />
      <Route path="/dashboard/signature" element={<PrivateRoute><SignaturePage /></PrivateRoute>} />
      <Route path="/dashboard/billing" element={<PrivateRoute><BillingPage /></PrivateRoute>} />
      <Route path="/dashboard/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />

      {/* 404 — всё что не нашлось */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
