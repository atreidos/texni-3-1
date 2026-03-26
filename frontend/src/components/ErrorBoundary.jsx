// ============================================================
// ErrorBoundary — перехват ошибок рендера React
// Показывает ошибку на экране только если включено в config (showErrorsOnScreen)
// ============================================================

import { Component } from 'react';
import * as Sentry from '@sentry/react';
import { showErrorsOnScreen } from '../config';
import { AlertCircle } from 'lucide-react';

export default class ErrorBoundary extends Component {
  state = { error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState((s) => ({ ...s, errorInfo }));
    Sentry.captureException(error, {
      contexts: { react: { componentStack: errorInfo?.componentStack } },
    });
    if (showErrorsOnScreen) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  render() {
    const { error, errorInfo } = this.state;
    const { children } = this.props;

    if (error && showErrorsOnScreen) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-white rounded-xl border border-red-200 shadow-lg overflow-hidden">
            <div className="bg-red-50 border-b border-red-200 px-6 py-4 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
              <h1 className="text-lg font-semibold text-red-800">Ошибка приложения</h1>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm font-medium text-slate-700">Сообщение:</p>
              <pre className="p-4 bg-slate-100 rounded-lg text-sm text-red-700 overflow-x-auto whitespace-pre-wrap break-words">
                {error?.message ?? String(error)}
              </pre>
              {errorInfo?.componentStack && (
                <>
                  <p className="text-sm font-medium text-slate-700">Компонент:</p>
                  <pre className="p-4 bg-slate-100 rounded-lg text-xs text-slate-600 overflow-x-auto whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                    {errorInfo.componentStack}
                  </pre>
                </>
              )}
              <p className="text-xs text-slate-500">
                Вывод ошибок включён (VITE_SHOW_ERRORS=true). В .env поставьте VITE_SHOW_ERRORS=false или удалите переменную, чтобы скрыть.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (error && !showErrorsOnScreen) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <p className="text-slate-500">Произошла ошибка. Включите вывод ошибок (VITE_SHOW_ERRORS=true в .env) для деталей.</p>
        </div>
      );
    }

    return children;
  }
}
