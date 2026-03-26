// ============================================================
// YandexMetrikaRouteTracker — виртуальные просмотры для SPA (React Router).
// Первый показ страницы уходит из ym(..., 'init', { url }) в index.html;
// при client-side навигации отправляем hit, чтобы не дублировать первый визит.
// ============================================================

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const METRIKA_ID = 108256000;

export default function YandexMetrikaRouteTracker() {
  const location = useLocation();
  const isFirstHit = useRef(true);

  useEffect(() => {
    if (typeof window.ym !== 'function') return;

    const path = `${location.pathname}${location.search}`;

    if (isFirstHit.current) {
      isFirstHit.current = false;
      return;
    }

    window.ym(METRIKA_ID, 'hit', path);
  }, [location.pathname, location.search]);

  return null;
}
