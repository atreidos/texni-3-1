// ============================================================
// Конфигурация приложения (читает из .env через Vite)
// Переменные с префиксом VITE_ доступны в клиенте
// ============================================================

/**
 * Показывать ли ошибки на экране (Error Boundary + необработанные промисы).
 * В production всегда false — стек-трейсы не должны показываться пользователям.
 * Включить только в dev: в .env добавить VITE_SHOW_ERRORS=true
 */
export const showErrorsOnScreen =
  import.meta.env.DEV &&
  (import.meta.env.VITE_SHOW_ERRORS === 'true' || import.meta.env.VITE_SHOW_ERRORS === '1');
