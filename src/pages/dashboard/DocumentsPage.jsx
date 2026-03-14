// ============================================================
// DocumentsPage — список документов /dashboard/documents
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Download, Trash2, ExternalLink, Filter } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import { mockDocuments } from '../../data/mockData';

export default function DocumentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [docs, setDocs] = useState(mockDocuments);

  // Фильтрация документов
  const filtered = docs.filter(doc => {
    const matchSearch = doc.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || doc.status === filterStatus;
    return matchSearch && matchStatus;
  });

  function handleDelete(id) {
    setDocs(prev => prev.filter(d => d.id !== id));
  }

  return (
    <DashboardLayout title="Мои документы">

      {/* Фильтры и поиск */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Поиск */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по названию..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* Фильтр по статусу */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все статусы</option>
            <option value="draft">Черновики</option>
            <option value="filled">Заполненные</option>
            <option value="signed">Подписанные</option>
          </select>
        </div>
      </div>

      {/* Таблица документов */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <FileText size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400">Документы не найдены</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Документ</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Организация</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">Изменён</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Статус</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                  {/* Название */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-slate-100 rounded">
                        <FileText size={15} className="text-slate-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{doc.name}</p>
                        <p className="text-xs text-slate-400">{doc.type.toUpperCase()} · {doc.size}</p>
                      </div>
                    </div>
                  </td>
                  {/* Организация */}
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <p className="text-sm text-slate-600">{doc.organization}</p>
                  </td>
                  {/* Дата */}
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <p className="text-sm text-slate-500">{doc.updatedAt}</p>
                  </td>
                  {/* Статус */}
                  <td className="px-5 py-3.5">
                    <StatusBadge status={doc.status} />
                  </td>
                  {/* Действия */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate('/editor')}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Открыть"
                      >
                        <ExternalLink size={15} />
                      </button>
                      <button
                        className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Скачать"
                      >
                        <Download size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Удалить"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Пагинация (заглушка) */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
          <p>Показано {filtered.length} из {docs.length}</p>
          <div className="flex gap-1">
            {[1, 2, 3].map(n => (
              <button
                key={n}
                className={`w-8 h-8 rounded-lg text-sm ${n === 1 ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
