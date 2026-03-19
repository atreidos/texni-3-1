// ============================================================
// ErrorBanner — единый компонент для отображения ошибок
// Заменяет alert() на inline-сообщение с возможностью закрыть
// ============================================================

import { AlertCircle, X } from 'lucide-react';

export default function ErrorBanner({ message, onDismiss, className = '' }) {
  if (!message) return null;

  return (
    <div
      className={`flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg ${className}`}
      role="alert"
    >
      <div className="flex items-center gap-2 min-w-0">
        <AlertCircle size={18} className="flex-shrink-0 text-red-500" />
        <span className="text-sm">{message}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="flex-shrink-0 p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
          aria-label="Закрыть"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
