// ============================================================
// EditorPage — редактор документа /editor
// Доступен без регистрации.
// Состояния: 1) зона загрузки → 2) split-view редактор
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download, Save, PenTool, Building2, Sparkles,
  ChevronLeft, ChevronRight, AlertCircle, X, Loader2
} from 'lucide-react';
import Header from '../components/Header';
import FileUploader from '../components/FileUploader';
import ProBadge from '../components/ProBadge';
import { useAuth } from '../context/AuthContext';
import { mockDocumentFields } from '../data/mockData';
import { supabase, callEdgeFunction } from '../lib/supabase';

// Группы полей документа
const GROUP_LABELS = {
  organization: 'Организация',
  contractor: 'Контрагент',
  other: 'Прочее',
};

function getFileType(file) {
  const n = (file?.name || '').toLowerCase();
  if (n.endsWith('.pdf')) return 'pdf';
  if (n.endsWith('.docx')) return 'docx';
  return 'pdf';
}

export default function EditorPage() {
  const { isLoggedIn, user, accessToken } = useAuth();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);              // загруженный файл
  const [fields, setFields] = useState(mockDocumentFields); // поля документа
  const [currentPage, setCurrentPage] = useState(1);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showBanner, setShowBanner] = useState(true);  // баннер "войдите чтобы сохранить"
  const totalPages = 3; // заглушка — 3 страницы

  // Обновление значения поля
  function handleFieldChange(id, value) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, value } : f));
    setIsSaved(false);
  }

  // Сохранение в Storage + создание записи в БД
  async function handleSave() {
    if (!isLoggedIn || !user || !accessToken || !file) {
      setShowBanner(true);
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      const docId = crypto.randomUUID();
      const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${user.id}/${docId}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { upsert: false });
      if (uploadError) throw new Error(uploadError.message || 'Ошибка загрузки файла');

      const type = getFileType(file);
      const { error: createError } = await callEdgeFunction(
        'documents-create',
        { id: docId, name: file.name, type, file_path: filePath, size_bytes: file.size },
        accessToken
      );
      if (createError) throw new Error(createError.message);

      setIsSaved(true);
      navigate('/dashboard/documents');
    } catch (e) {
      setSaveError(e?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  // Группируем поля по группам
  const grouped = Object.entries(GROUP_LABELS).map(([key, label]) => ({
    key,
    label,
    fields: fields.filter(f => f.group === key),
  }));

  // Если файл ещё не загружен — показываем зону загрузки
  if (!file) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Загрузить документ</h1>
          <p className="text-slate-500 mb-8">Заполните .docx или .pdf без регистрации</p>
          <FileUploader onFileSelect={setFile} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">

      {/* ===== Тулбар ===== */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        {/* Название файла + статус */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFile(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
            title="Загрузить другой файл"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-semibold text-slate-800 text-sm truncate max-w-xs">
            {file.name}
          </span>
          {isLoggedIn && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${isSaved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {isSaved ? '✓ Сохранено' : '● Не сохранено'}
            </span>
          )}
        </div>

        {/* Кнопки тулбара */}
        <div className="flex items-center gap-2">
          {/* Подписать ЭЦП — только для авторизованных */}
          {isLoggedIn ? (
            <button
              onClick={() => navigate('/dashboard/signature')}
              className="flex items-center gap-1.5 text-sm border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
            >
              <PenTool size={15} />
              Подписать ЭЦП
            </button>
          ) : (
            <button
              onClick={() => navigate('/auth/login')}
              className="flex items-center gap-1.5 text-sm border border-slate-200 px-3 py-2 rounded-lg text-slate-400 cursor-pointer hover:bg-slate-50"
            >
              <PenTool size={15} />
              Подписать ЭЦП
            </button>
          )}

          {/* Сохранить */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-sm border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-slate-600 disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>

          {/* Скачать */}
          <button className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <Download size={15} />
            Скачать
          </button>
        </div>
      </div>

      {/* Ошибка сохранения */}
      {saveError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 flex items-center justify-between">
          <span className="text-sm text-red-800">{saveError}</span>
          <button onClick={() => setSaveError(null)} className="text-red-600 hover:text-red-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Баннер для незарегистрированных */}
      {!isLoggedIn && showBanner && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <AlertCircle size={16} />
            <span>
              Войдите или зарегистрируйтесь, чтобы сохранять документы и использовать ЭЦП.{' '}
              <button onClick={() => navigate('/auth/register')} className="font-semibold underline">
                Зарегистрироваться бесплатно
              </button>
            </span>
          </div>
          <button onClick={() => setShowBanner(false)} className="text-amber-600 hover:text-amber-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ===== Split-view ===== */}
      <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>

        {/* ----- Левая панель: форма реквизитов ----- */}
        <div className="w-96 bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">Поля документа</h2>
            <p className="text-xs text-slate-400 mt-0.5">Найдено {fields.length} полей</p>
          </div>

          {/* Кнопки быстрого заполнения */}
          <div className="p-3 border-b border-slate-100 space-y-2">
            {/* Заполнить из организации */}
            <button
              disabled={!isLoggedIn}
              onClick={() => {}}
              className={`w-full flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-colors ${
                isLoggedIn
                  ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  : 'border-slate-100 text-slate-300 cursor-not-allowed'
              }`}
            >
              <Building2 size={15} />
              Заполнить из организации
              {!isLoggedIn && <span className="text-xs ml-auto text-slate-300">Войдите</span>}
            </button>

            {/* ИИ-заполнение — платная функция */}
            <button
              disabled={!isLoggedIn}
              className={`w-full flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-colors ${
                isLoggedIn
                  ? 'border-purple-200 text-purple-700 hover:bg-purple-50'
                  : 'border-slate-100 text-slate-300 cursor-not-allowed'
              }`}
            >
              <Sparkles size={15} />
              Заполнить с помощью ИИ
              <ProBadge />
            </button>
          </div>

          {/* Поля сгруппированные */}
          <div className="flex-1 p-3 space-y-4 overflow-y-auto">
            {grouped.map(({ key, label, fields: groupFields }) => (
              <div key={key}>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {label}
                </h3>
                <div className="space-y-2">
                  {groupFields.map(field => (
                    <div key={field.id}>
                      <label className="block text-xs text-slate-500 mb-1">{field.label}</label>
                      <input
                        type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                        value={field.value}
                        onChange={e => handleFieldChange(field.id, e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Кнопка скачать (внизу панели) */}
          <div className="p-3 border-t border-slate-100">
            <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
              <Download size={16} />
              Скачать документ
            </button>
          </div>
        </div>

        {/* ----- Правая панель: превью документа ----- */}
        <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden">

          {/* Пагинация */}
          <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-center gap-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-slate-600">
              Страница {currentPage} из {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Заглушка превью документа */}
          <div className="flex-1 overflow-auto p-6 flex justify-center">
            <div className="bg-white shadow-lg rounded-sm w-full max-w-2xl min-h-[800px] p-12 relative">

              {/* Имитация содержимого документа */}
              <div className="text-center mb-8">
                <p className="font-bold text-lg">ДОГОВОР ОКАЗАНИЯ УСЛУГ</p>
                <p className="text-sm text-slate-500">№ {fields.find(f => f.id === 'doc_number')?.value || '__'} от {fields.find(f => f.id === 'doc_date')?.value || '______'}</p>
              </div>

              <div className="space-y-4 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">
                    {fields.find(f => f.id === 'org_name')?.value || '[Название организации]'}
                  </span>, именуемое в дальнейшем «Исполнитель», в лице Генерального директора, действующего на основании Устава, с одной стороны,
                </p>
                <p>
                  и <span className="bg-yellow-100 px-1 rounded font-semibold">
                    {fields.find(f => f.id === 'contractor_name')?.value || '[Контрагент]'}
                  </span>, именуемое в дальнейшем «Заказчик», с другой стороны,
                </p>
                <p>заключили настоящий договор о нижеследующем:</p>

                <div className="mt-6">
                  <p className="font-semibold mb-2">1. ПРЕДМЕТ ДОГОВОРА</p>
                  <p>1.1. Исполнитель обязуется оказать Заказчику услуги в соответствии с настоящим договором.</p>
                  <p className="mt-2">1.2. Общая стоимость услуг составляет{' '}
                    <span className="bg-yellow-100 px-1 rounded font-semibold">
                      {fields.find(f => f.id === 'amount')?.value
                        ? `${Number(fields.find(f => f.id === 'amount')?.value).toLocaleString('ru')} руб.`
                        : '[Сумма]'}
                    </span>
                  </p>
                </div>

                <div className="mt-4">
                  <p className="font-semibold mb-2">2. РЕКВИЗИТЫ СТОРОН</p>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="font-semibold mb-1">Исполнитель:</p>
                      <p>{fields.find(f => f.id === 'org_name')?.value || '____________'}</p>
                      <p>ИНН: <span className="bg-yellow-100 px-0.5">{fields.find(f => f.id === 'org_inn')?.value || '____________'}</span></p>
                      <p>КПП: {fields.find(f => f.id === 'org_kpp')?.value || '____________'}</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Заказчик:</p>
                      <p>{fields.find(f => f.id === 'contractor_name')?.value || '____________'}</p>
                      <p>ИНН: <span className="bg-yellow-100 px-0.5">{fields.find(f => f.id === 'contractor_inn')?.value || '____________'}</span></p>
                    </div>
                  </div>
                </div>

                {/* Заглушка для страниц 2 и 3 */}
                {currentPage > 1 && (
                  <div className="mt-8 p-4 bg-slate-50 rounded text-center text-slate-400 text-xs">
                    Страница {currentPage} — продолжение документа
                  </div>
                )}
              </div>

              {/* Номер страницы */}
              <div className="absolute bottom-4 right-6 text-xs text-slate-300">
                {currentPage} / {totalPages}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
