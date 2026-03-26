// ============================================================
// main.jsx — точка входа приложения
// instrument.js — Sentry (должен импортироваться первым, см. instrument.js)
// Оборачиваем App в BrowserRouter и AuthProvider
// ErrorBoundary перехватывает ошибки рендера (при VITE_SHOW_ERRORS=true)
// UnhandledRejectionHandler показывает ошибки промисов
// ============================================================

import './instrument';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import UnhandledRejectionHandler from './components/UnhandledRejectionHandler';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <UnhandledRejectionHandler>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </UnhandledRejectionHandler>
    </ErrorBoundary>
  </StrictMode>
);
