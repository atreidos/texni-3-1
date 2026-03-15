// ============================================================
// App.jsx — корневой компонент с роутингом
//
// Маршруты:
//   /                          → LandingPage
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

// Страницы личного кабинета
import DashboardPage from './pages/dashboard/DashboardPage';
import DocumentsPage from './pages/dashboard/DocumentsPage';
import OrganizationsPage from './pages/dashboard/OrganizationsPage';
import SignaturePage from './pages/dashboard/SignaturePage';
import BillingPage from './pages/dashboard/BillingPage';
import SettingsPage from './pages/dashboard/SettingsPage';

// Компонент-обёртка для защищённых маршрутов
// Пока идёт проверка сессии — рендерим пустой экран, не редиректим
function PrivateRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return null;
  return isLoggedIn ? children : <Navigate to="/auth/login" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Публичные страницы */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/editor" element={<EditorPage />} />
      <Route path="/pricing" element={<PricingPage />} />

      {/* Авторизация */}
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />

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
