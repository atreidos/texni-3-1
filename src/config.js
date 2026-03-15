// ============================================================
// Конфигурация приложения (читает из .env через Vite)
// Переменные с префиксом VITE_ доступны в клиенте
// ============================================================

/**
 * Показывать ли ошибки на экране (Error Boundary + необработанные промисы).
 * Включить: в .env добавить VITE_SHOW_ERRORS=true
 * Выключить: удалить переменную или поставить VITE_SHOW_ERRORS=false
 */
export const showErrorsOnScreen =
  import.meta.env.VITE_SHOW_ERRORS === 'true' || import.meta.env.VITE_SHOW_ERRORS === '1';
