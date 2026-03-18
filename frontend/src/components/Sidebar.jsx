// ============================================================
// Sidebar — боковая навигация для личного кабинета
// ============================================================

import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FileText, Building2, PenTool, CreditCard,
  Settings, LogOut, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Пункты навигации сайдбара
const navItems = [
  { path: '/dashboard', label: 'Обзор', icon: FileText, exact: true },
  { path: '/dashboard/documents', label: 'Документы', icon: FileText },
  { path: '/dashboard/organizations', label: 'Организации', icon: Building2 },
  { path: '/dashboard/signature', label: 'ЭЦП', icon: PenTool },
  { path: '/dashboard/billing', label: 'Тариф', icon: CreditCard },
  { path: '/dashboard/settings', label: 'Настройки', icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-200 flex flex-col">

      {/* Логотип */}
      <div className="p-6 border-b border-slate-100">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
          <FileText size={22} />
          <span>DocFlow</span>
        </Link>
      </div>

      {/* Информация о пользователе */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {/* Аватар — инициалы, если нет фото */}
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-slate-800 truncate">{user?.name}</p>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium capitalize">
              {user?.plan === 'pro' ? 'PRO' : user?.plan === 'business' ? 'Бизнес' : 'Бесплатно'}
            </span>
          </div>
        </div>
      </div>

      {/* Навигация */}
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navItems.map(({ path, label, icon: Icon, exact }) => {
            // Определяем активный пункт меню
            const isActive = exact
              ? location.pathname === path
              : location.pathname.startsWith(path) && path !== '/dashboard';

            return (
              <li key={path}>
                <Link
                  to={path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <Icon size={18} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={14} />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Кнопка выхода */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors w-full"
        >
          <LogOut size={18} />
          <span>Выйти</span>
        </button>
      </div>
    </aside>
  );
}
