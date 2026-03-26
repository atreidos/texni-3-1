// ============================================================
// Sentry — инициализация до остального приложения (import в main.jsx первым)
// DSN: VITE_SENTRY_DSN в .env (Client Keys в проекте Sentry)
// ============================================================

import * as Sentry from '@sentry/react';
import { useEffect } from 'react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';

const dsn = import.meta.env.VITE_SENTRY_DSN;

export const isSentryEnabled = Boolean(dsn && String(dsn).trim());

if (isSentryEnabled) {
  Sentry.init({
    dsn: String(dsn).trim(),
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    integrations: [
      Sentry.reactRouterV7BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
    replaysSessionSampleRate: import.meta.env.PROD ? 0.05 : 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
