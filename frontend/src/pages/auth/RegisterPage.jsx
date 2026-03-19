// ============================================================
// RegisterPage — страница регистрации /auth/register
// ============================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [agreed, setAgreed] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Введите имя';
    if (!form.email.trim()) e.email = 'Введите email';
    else if (!emailRegex.test(form.email.trim())) e.email = 'Неверный формат email';
    if (form.password.length < 8) e.password = 'Пароль минимум 8 символов';
    if (form.password !== form.confirm) e.confirm = 'Пароли не совпадают';
    if (!agreed) e.agreed = 'Необходимо принять оферту';
    return e;
  }

  function handleChange(field) {
    return (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    const e2 = validate();
    if (Object.keys(e2).length > 0) {
      setErrors(e2);
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      // Supabase может потребовать подтверждение email — показываем сообщение
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Логотип */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-2xl text-blue-600">
            <FileText size={28} />
            DocFlow
          </Link>
          <p className="text-slate-500 mt-2">Создайте аккаунт бесплатно</p>
        </div>

        {/* Форма */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Имя */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Имя</label>
              <input
                type="text"
                value={form.name}
                onChange={handleChange('name')}
                placeholder="Иван Петров"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.name ? 'border-red-300' : 'border-slate-200'}`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="ivan@example.com"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.email ? 'border-red-300' : 'border-slate-200'}`}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Пароль */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Пароль</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange('password')}
                  placeholder="Минимум 8 символов"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${errors.password ? 'border-red-300' : 'border-slate-200'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            {/* Повтор пароля */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Повторите пароль</label>
              <input
                type="password"
                value={form.confirm}
                onChange={handleChange('confirm')}
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.confirm ? 'border-red-300' : 'border-slate-200'}`}
              />
              {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm}</p>}
            </div>

            {/* Согласие с офертой */}
            <div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-slate-600">
                  Я принимаю{' '}
                  <a href="#" className="text-blue-600 hover:underline">условия оферты</a>{' '}
                  и{' '}
                  <a href="#" className="text-blue-600 hover:underline">политику конфиденциальности</a>
                </span>
              </label>
              {errors.agreed && <p className="text-xs text-red-500 mt-1">{errors.agreed}</p>}
            </div>

            {serverError && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{serverError}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Создаём аккаунт...' : 'Создать аккаунт'}
            </button>
          </form>
        </div>

        {/* Ссылка на вход */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Уже есть аккаунт?{' '}
          <Link to="/auth/login" className="text-blue-600 font-medium hover:text-blue-700">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
