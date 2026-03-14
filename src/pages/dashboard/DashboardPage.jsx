// ============================================================
// DashboardPage — главная страница личного кабинета /dashboard
// ============================================================

import { useNavigate } from 'react-router-dom';
import { Upload, Building2, FileText, ArrowRight } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { mockDocuments, mockUser } from '../../data/mockData';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Прогресс использования документов
  const usagePercent = Math.round((mockUser.docsUsed / mockUser.docsLimit) * 100);

  return (
    <DashboardLayout title="Обзор">

      {/* ===== Быстрые действия ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => navigate('/editor')}
          className="flex items-center gap-4 bg-blue-600 text-white rounded-xl p-5 hover:bg-blue-700 transition-colors text-left"
        >
          <div className="p-3 bg-blue-500 rounded-xl">
            <Upload size={22} />
          </div>
          <div>
            <p className="font-semibold">Загрузить документ</p>
            <p className="text-blue-200 text-sm">Заполнить договор, акт или счёт</p>
          </div>
          <ArrowRight size={18} className="ml-auto text-blue-300" />
        </button>

        <button
          onClick={() => navigate('/dashboard/organizations')}
          className="flex items-center gap-4 bg-white border border-slate-200 text-slate-700 rounded-xl p-5 hover:bg-slate-50 transition-colors text-left"
        >
          <div className="p-3 bg-orange-50 rounded-xl text-orange-500">
            <Building2 size={22} />
          </div>
          <div>
            <p className="font-semibold">Добавить организацию</p>
            <p className="text-slate-400 text-sm">Сохраните реквизиты для автозаполнения</p>
          </div>
          <ArrowRight size={18} className="ml-auto text-slate-300" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ===== Последние документы (2/3) ===== */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Последние документы</h2>
            <button
              onClick={() => navigate('/dashboard/documents')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Все документы <ArrowRight size={14} />
            </button>
          </div>

          <div className="divide-y divide-slate-50">
            {mockDocuments.slice(0, 4).map(doc => (
              <div key={doc.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <FileText size={16} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
                  <p className="text-xs text-slate-400">{doc.organization} · {doc.updatedAt}</p>
                </div>
                <StatusBadge status={doc.status} />
                <button
                  onClick={() => navigate('/editor')}
                  className="text-xs text-blue-600 hover:text-blue-700 ml-2"
                >
                  Открыть
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ===== Виджет тарифа (1/3) ===== */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Текущий тариф</h2>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl font-bold text-slate-800 capitalize">
              {user?.plan === 'pro' ? 'Про' : user?.plan === 'business' ? 'Бизнес' : 'Бесплатно'}
            </span>
            <span className="text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-0.5 rounded-full">
              {user?.plan?.toUpperCase()}
            </span>
          </div>

          {/* Прогресс документов */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Использовано документов</span>
              <span>{mockUser.docsUsed} / {mockUser.docsLimit}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${usagePercent > 80 ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">{usagePercent}% использовано</p>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            Действует до: <strong className="text-slate-600">{mockUser.planExpires}</strong>
          </p>

          <button
            onClick={() => navigate('/dashboard/billing')}
            className="w-full text-sm border border-slate-200 text-slate-600 py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Управление тарифом
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
