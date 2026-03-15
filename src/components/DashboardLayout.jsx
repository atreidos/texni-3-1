// ============================================================
// DashboardLayout — обёртка для всех страниц личного кабинета
// Содержит Sidebar + шапку с кнопкой загрузки + основной контент
// ============================================================

import { Link, useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout({ children, title }) {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* Боковая панель */}
      <Sidebar />

      {/* Основная часть */}
      <div className="flex-1 flex flex-col">

        {/* Верхняя шапка ЛК */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800">{title}</h1>

          <div className="flex items-center gap-4">
            {/* Кнопка загрузки документа */}
            <button
              onClick={() => navigate('/editor')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Upload size={16} />
              Загрузить документ
            </button>

            {/* Аватар с именем */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                {profile?.name?.charAt(0) || 'U'}
              </div>
              <span className="text-sm text-slate-600">{profile?.name}</span>
            </div>
          </div>
        </header>

        {/* Контент страницы */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
