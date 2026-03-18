// ============================================================
// DocumentsPage — список документов /dashboard/documents
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Download, Trash2, ExternalLink, Filter, AlertCircle, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

// Форматируем размер в байтах → «48 КБ»
function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

// Форматируем timestamptz → «YYYY-MM-DD»
function formatDate(iso) {
  if (!iso) return '—';
  return iso.split('T')[0];
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    if (!user?.id) return;
    fetchDocs();
  }, [user?.id]);

  const LOAD_TIMEOUT_MS = 30000;
  const LOAD_TIMEOUT_MSG = 'Загрузка заняла более 30 секунд. Проверьте соединение и попробуйте снова.';

  async function fetchDocs() {
    setLoading(true);
    setError(null);
    const query = supabase
      .from('documents')
      .select('*, organizations(name)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(LOAD_TIMEOUT_MSG)), LOAD_TIMEOUT_MS)
    );
    try {
      const { data, error: err } = await Promise.race([query, timeoutPromise]);
      if (err) {
        setError(err.message);
      } else {
        setDocs(data || []);
      }
    } catch (e) {
      setError(e?.message || LOAD_TIMEOUT_MSG);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const { error: err } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (err) {
      alert(`Ошибка удаления: ${err.message}`);
    } else {
      setDocs(prev => prev.filter(d => d.id !== id));
    }
  }

  // Фильтрация на фронтенде (поиск + статус)
  const filtered = docs.filter(doc => {
    const matchSearch = doc.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || doc.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Сортировка по дате изменения
  const sorted = [...filtered].sort((a, b) => {
    const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
  });

  return (
    <DashboardLayout title="Мои документы">

      {/* Фильтры, поиск и сортировка */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
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

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 whitespace-nowrap">Сортировка по дате</span>
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="desc">Сначала новые</option>
            <option value="asc">Сначала старые</option>
          </select>
        </div>
      </div>

      {/* Состояния загрузки / ошибки / пусто */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 flex items-center justify-center gap-2 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
          <span>Загрузка...</span>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-200 py-16 flex flex-col items-center justify-center gap-3 text-red-500">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchDocs()}
            className="text-sm bg-red-50 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
          >
            Повторить
          </button>
        </div>
      ) : (
        <>
          {/* Таблица документов */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {sorted.length === 0 ? (
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
                  {sorted.map(doc => (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-slate-100 rounded">
                            <FileText size={15} className="text-slate-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{doc.name}</p>
                            <p className="text-xs text-slate-400">
                              {doc.type.toUpperCase()} · {formatSize(doc.size_bytes)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <p className="text-sm text-slate-600">{doc.organizations?.name ?? '—'}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <p className="text-sm text-slate-500">{formatDate(doc.updated_at)}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={doc.status} />
                      </td>
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

          {sorted.length > 0 && (
            <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
              <p>Показано {sorted.length} из {docs.length}</p>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
