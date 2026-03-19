// ============================================================
// LoginPage — страница входа /auth/login
// ============================================================

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Eye, EyeOff, ExternalLink, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Редирект после успешного входа (isLoggedIn обновляется в onAuthStateChange асинхронно)
  useEffect(() => {
    if (isLoggedIn) navigate('/dashboard', { replace: true });
  }, [isLoggedIn, navigate]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email?.trim()) {
      setError('Введите email');
      return;
    }
    if (!emailRegex.test(email.trim())) {
      setError('Неверный формат email');
      return;
    }
    if (!password) {
      setError('Введите пароль');
      return;
    }

    setLoading(true);
    const timeoutId = setTimeout(() => setLoading(false), 15000); // страховка от зависания
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Неверный email или пароль');
    } finally {
      clearTimeout(timeoutId);
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
          <p className="text-slate-500 mt-2">Войдите в свой аккаунт</p>
        </div>

        {/* Форма */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ivan@example.com"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Пароль */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">Пароль</label>
                <Link to="/auth/forgot-password" className="text-xs text-blue-600 hover:text-blue-700">
                  Забыли пароль?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Ошибка */}
            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={!email || !password || loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          {/* Разделитель */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">или</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Вход через Госуслуги (заглушка) */}
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-500 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-colors opacity-60 cursor-not-allowed"
          >
            <ExternalLink size={16} />
            Войти через Госуслуги
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-400">скоро</span>
          </button>
        </div>

        {/* Ссылка на регистрацию */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Нет аккаунта?{' '}
          <Link to="/auth/register" className="text-blue-600 font-medium hover:text-blue-700">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}
