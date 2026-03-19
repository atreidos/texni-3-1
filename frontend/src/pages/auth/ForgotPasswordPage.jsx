// ============================================================
// ForgotPasswordPage — восстановление пароля /auth/forgot-password
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Введите email');
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Неверный формат email');
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (err) {
        setError(err.message || 'Не удалось отправить письмо');
        return;
      }
      setSent(true);
    } catch (err) {
      setError(err?.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Логотип */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-2xl text-blue-600">
            <FileText size={28} />
            DocFlow
          </Link>
        </div>

        {/* Форма */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

          {!sent ? (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail size={24} className="text-blue-600" />
                </div>
                <h1 className="text-xl font-bold text-slate-800">Забыли пароль?</h1>
                <p className="text-slate-500 text-sm mt-1">
                  Введите email — мы отправим ссылку для восстановления
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="ivan@example.com"
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${error ? 'border-red-300' : 'border-slate-200'}`}
                  />
                  {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? 'Отправка...' : 'Отправить ссылку'}
                </button>
              </form>
            </>
          ) : (
            // Экран подтверждения
            <div className="text-center py-4">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">Проверьте почту</h2>
              <p className="text-slate-500 text-sm">
                Мы отправили ссылку для восстановления на{' '}
                <strong className="text-slate-700">{email}</strong>
              </p>
              <p className="text-slate-400 text-xs mt-3">
                Письмо может прийти в течение нескольких минут. Проверьте папку «Спам».
              </p>
            </div>
          )}
        </div>

        {/* Ссылка назад */}
        <div className="text-center mt-6">
          <Link
            to="/auth/login"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={14} />
            Вернуться ко входу
          </Link>
        </div>
      </div>
    </div>
  );
}
