// ============================================================
// Header — шапка для всех публичных страниц
// ============================================================

import { Link, useNavigate } from 'react-router-dom';
import { FileText, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Логотип */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <FileText size={24} />
            <span>DocFlow</span>
          </Link>

          {/* Навигация — десктоп */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <Link to="/" className="hover:text-blue-600 transition-colors">Главная</Link>
            <Link to="/editor" className="hover:text-blue-600 transition-colors">Редактор</Link>
            <Link to="/pricing" className="hover:text-blue-600 transition-colors">Тарифы</Link>
          </nav>

          {/* Кнопки авторизации — десктоп */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                {/* Имя пользователя и ссылка в ЛК */}
                <Link
                  to="/dashboard"
                  className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
                >
                  {user?.name}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm text-slate-500 hover:text-red-500 transition-colors"
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="text-sm text-slate-600 hover:text-blue-600 transition-colors px-4 py-2 rounded-lg hover:bg-slate-100"
                >
                  Войти
                </Link>
                <Link
                  to="/auth/register"
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Зарегистрироваться
                </Link>
              </>
            )}
          </div>

          {/* Бургер-меню для мобильных */}
          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Мобильное меню */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 py-3 flex flex-col gap-2">
            <Link to="/" className="px-2 py-2 text-slate-600 hover:text-blue-600" onClick={() => setMenuOpen(false)}>Главная</Link>
            <Link to="/editor" className="px-2 py-2 text-slate-600 hover:text-blue-600" onClick={() => setMenuOpen(false)}>Редактор</Link>
            <Link to="/pricing" className="px-2 py-2 text-slate-600 hover:text-blue-600" onClick={() => setMenuOpen(false)}>Тарифы</Link>
            {isLoggedIn ? (
              <>
                <Link to="/dashboard" className="px-2 py-2 text-slate-600" onClick={() => setMenuOpen(false)}>Личный кабинет</Link>
                <button onClick={handleLogout} className="text-left px-2 py-2 text-red-500">Выйти</button>
              </>
            ) : (
              <>
                <Link to="/auth/login" className="px-2 py-2 text-slate-600" onClick={() => setMenuOpen(false)}>Войти</Link>
                <Link to="/auth/register" className="px-2 py-2 text-blue-600 font-medium" onClick={() => setMenuOpen(false)}>Зарегистрироваться</Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
