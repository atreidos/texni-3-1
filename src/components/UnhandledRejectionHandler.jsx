// ============================================================
// UnhandledRejectionHandler — показывает необработанные ошибки промисов
// Работает только при showErrorsOnScreen === true
// ============================================================

import { useState, useEffect } from 'react';
import { showErrorsOnScreen } from '../config';
import { AlertCircle } from 'lucide-react';

export default function UnhandledRejectionHandler({ children }) {
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!showErrorsOnScreen) return;

    function handleRejection(event) {
      const err = event?.reason ?? new Error('Unknown rejection');
      setError({
        message: err?.message ?? String(err),
        stack: err?.stack,
      });
      event.preventDefault?.();
    }

    window.addEventListener('unhandledrejection', handleRejection);
    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, []);

  if (!showErrorsOnScreen || !error) return children;

  return (
    <>
      {children}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/50">
        <div className="max-w-2xl w-full bg-white rounded-xl border border-red-200 shadow-xl overflow-hidden">
          <div className="bg-red-50 border-b border-red-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
              <h1 className="text-lg font-semibold text-red-800">Необработанная ошибка (промис)</h1>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-sm text-slate-600 hover:text-slate-800 underline"
            >
              Закрыть
            </button>
          </div>
          <div className="p-6 space-y-4">
            <pre className="p-4 bg-slate-100 rounded-lg text-sm text-red-700 overflow-x-auto whitespace-pre-wrap break-words">
              {error.message}
            </pre>
            {error.stack && (
              <pre className="p-4 bg-slate-100 rounded-lg text-xs text-slate-600 overflow-auto whitespace-pre-wrap break-words max-h-40">
                {error.stack}
              </pre>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
