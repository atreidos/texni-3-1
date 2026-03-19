// ============================================================
// ResetPasswordPage — установка нового пароля после клика по ссылке из письма
// URL: /auth/reset-password#access_token=...&type=recovery
// Supabase вызывает redirectTo после resetPasswordForEmail
// ============================================================

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Lock, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [hasRecoveryToken, setHasRecoveryToken] = useState(null);

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', ''));
    const type = params.get('type');
    const token = params.get('access_token');
    setHasRecoveryToken(Boolean(token && type === 'recovery'));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Пароль минимум ${MIN_PASSWORD_LENGTH} символов`);
      return;
    }
    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) {
        setError(err.message || 'Не удалось обновить пароль');
        return;
      }
      setDone(true);
      setTimeout(() => navigate('/auth/login', { replace: true }), 2000);
    } catch (err) {
      setError(err?.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  }

  if (hasRecoveryToken === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!hasRecoveryToken) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Недействительная ссылка</h2>
          <p className="text-slate-500 text-sm mb-6">
            Ссылка для сброса пароля недействительна или устарела. Запросите новую.
          </p>
          <Link
            to="/auth/forgot-password"
            className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700"
          >
            Запросить ссылку
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <Lock size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Пароль изменён</h2>
          <p className="text-slate-500 text-sm">Перенаправление на страницу входа...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-2xl text-blue-600">
            <FileText size={28} />
            DocFlow
          </Link>
          <p className="text-slate-500 mt-2">Введите новый пароль</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Новый пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={`Минимум ${MIN_PASSWORD_LENGTH} символов`}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Повторите пароль</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Сохранение...' : 'Установить пароль'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          <Link to="/auth/login" className="text-blue-600 hover:text-blue-700">
            Вернуться ко входу
          </Link>
        </p>
      </div>
    </div>
  );
}
