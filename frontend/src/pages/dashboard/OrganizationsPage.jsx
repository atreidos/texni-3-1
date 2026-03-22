// ============================================================
// OrganizationsPage — управление организациями /dashboard/organizations
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Star, Building2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { callEdgeFunction, fetchFromEdge } from '../../lib/supabase';
import { allowFakeOrgData } from '../../config';
import { fakeOrgForm } from '../../data/mockData';
import ErrorBanner from '../../components/ErrorBanner';

// Начальное состояние формы новой организации
const emptyOrg = {
  name: '', inn: '', kpp: '', ogrn: '', address: '', phone: '', email: '',
  bank: { bik: '', bankName: '', checkingAccount: '', correspondentAccount: '' },
};

// Edge Functions возвращают DTO в camelCase.

// ============================================================
// Правила валидации по российским форматам реквизитов
// ============================================================
function validate(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = 'Введите название организации';
  }

  if (!form.inn) {
    errors.inn = 'Введите ИНН';
  } else if (!/^\d{10}$|^\d{12}$/.test(form.inn)) {
    errors.inn = 'ИНН — 10 цифр (юрлицо) или 12 цифр (ИП)';
  }

  if (form.kpp && !/^\d{9}$/.test(form.kpp)) {
    errors.kpp = 'КПП — 9 цифр';
  }

  if (form.ogrn && !/^\d{13}$|^\d{15}$/.test(form.ogrn)) {
    errors.ogrn = 'ОГРН — 13 цифр (юрлицо) или 15 цифр (ИП)';
  }

  if (form.bank?.bik && !/^\d{9}$/.test(form.bank.bik)) {
    errors.bik = 'БИК — 9 цифр';
  }

  if (form.bank?.checkingAccount && !/^\d{20}$/.test(form.bank.checkingAccount)) {
    errors.checkingAccount = 'Расчётный счёт — 20 цифр';
  }

  if (form.bank?.correspondentAccount && !/^\d{20}$/.test(form.bank.correspondentAccount)) {
    errors.correspondentAccount = 'Корр. счёт — 20 цифр';
  }

  return errors;
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function inputClass(hasError) {
  return `w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
    hasError
      ? 'border-red-400 focus:ring-red-400'
      : 'border-slate-200 focus:ring-blue-500'
  }`;
}

export default function OrganizationsPage() {
  const { user, accessToken } = useAuth();

  const [orgs, setOrgs] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editOrg, setEditOrg] = useState(null);
  const [form, setForm] = useState(emptyOrg);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState('requisites');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [actionError, setActionError] = useState(null);
  const [dadataLoading, setDadataLoading] = useState(false);
  const [dadataError, setDadataError] = useState('');
  const [dadataWarnings, setDadataWarnings] = useState([]);
  const retryCountRef = useRef(0);

  useEffect(() => {
    if (!user?.id || !accessToken) {
      setLoadingList(false);
      return;
    }
    fetchOrgs();
  }, [user?.id, accessToken]);

  const LOAD_TIMEOUT_MS = 90000; // 90 сек — cold start Supabase может быть долгим
  const LOAD_TIMEOUT_MSG = 'Сервер долго запускается (cold start). Нажмите «Повторить» — повторный запрос обычно быстрее.';

  async function fetchOrgs(isRetry = false) {
    setLoadingList(true);
    if (!isRetry) setListError(null);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), LOAD_TIMEOUT_MS)
    );
    let willRetry = false;
    try {
      const queryPromise = (async () => {
        const { data, error } = await fetchFromEdge('organizations-list');
        return { data, error };
      })();
      const { data, error: err } = await Promise.race([queryPromise, timeoutPromise]);
      if (err) {
        const isTimeout = err?.message === 'timeout';
        const isNetworkError = /connection reset|failed to fetch|network error/i.test(err?.message || '');
        if ((isTimeout || isNetworkError) && !isRetry) {
          willRetry = true;
          await new Promise((r) => setTimeout(r, 3000));
          return fetchOrgs(true);
        }
        setListError(err?.message === 'timeout' ? LOAD_TIMEOUT_MSG : err?.message || LOAD_TIMEOUT_MSG);
      } else {
        setOrgs(data?.data || []);
      }
    } catch (e) {
      const isTimeout = e?.message === 'timeout';
      const isNetworkError = /connection reset|failed to fetch|network error/i.test(e?.message || '');
      if ((isTimeout || isNetworkError) && !isRetry) {
        willRetry = true;
        await new Promise((r) => setTimeout(r, 3000));
        return fetchOrgs(true);
      }
      setListError(e?.message || LOAD_TIMEOUT_MSG);
    } finally {
      if (!willRetry) setLoadingList(false);
    }
  }

  function openAdd() {
    setEditOrg(null);
    setForm(emptyOrg);
    setErrors({});
    setSubmitted(false);
    setSaveError('');
    setDadataError('');
    setDadataWarnings([]);
    setActiveTab('requisites');
    setModalOpen(true);
  }

  function openEdit(org) {
    setEditOrg(org);
    setForm(org);
    setErrors({});
    setSubmitted(false);
    setSaveError('');
    setDadataError('');
    setDadataWarnings([]);
    setActiveTab('requisites');
    setModalOpen(true);
  }

  function setField(field, value) {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (submitted) setErrors(validate(updated));
  }

  function setBankField(field, value) {
    const updated = { ...form, bank: { ...form.bank, [field]: value } };
    setForm(updated);
    if (submitted) setErrors(validate(updated));
  }

  const innDigitsOnly = (form.inn || '').replace(/\D/g, '');
  const innValidForDadata = innDigitsOnly.length === 10 || innDigitsOnly.length === 12;

  async function handleFillFromDaData() {
    console.log('[DaData] handleFillFromDaData called', {
      hasUser: !!user?.id,
      hasAccessToken: !!accessToken,
      dadataLoading,
      innValidForDadata,
      innDigitsOnly,
    });
    if (!user?.id || !accessToken || dadataLoading || !innValidForDadata) {
      console.log('[DaData] early return');
      return;
    }
    setDadataLoading(true);
    setDadataError('');
    setDadataWarnings([]);

    const DADATA_TIMEOUT_MS = 15000;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), DADATA_TIMEOUT_MS)
    );

    try {
      let res, err, status;
      try {
        console.log('[DaData] invoking...', { inn: innDigitsOnly });
        const result = await Promise.race([
          callEdgeFunction('dadata-find-party', { inn: innDigitsOnly }, accessToken),
          timeoutPromise,
        ]);
        console.log('[DaData] result', result);
        res = result?.data;
        err = result?.error;
        status = result?.status ?? (result?.error ? 502 : 200);
      } catch (raceErr) {
        if (raceErr?.message === 'timeout') {
          setDadataError('Запрос занял слишком долго. Проверьте соединение.');
        } else {
          setDadataError('Не удалось получить данные. Проверьте соединение');
        }
        return;
      } finally {
        setDadataLoading(false);
      }

      if (err) {
        if (status === 400) {
          setDadataError('Проверьте правильность ИНН');
        } else if (status === 401 || status === 403) {
          setDadataError('Ошибка доступа к сервису. Обратитесь в поддержку');
        } else {
          setDadataError('Не удалось получить данные. Проверьте соединение');
        }
        return;
      }

      const data = res?.data;
      if (data === null || data === undefined) {
        setDadataError('Организация с таким ИНН не найдена');
        return;
      }

      const warnings = data.warnings || [];
      setDadataWarnings(warnings);

      setForm(prev => ({
        ...prev,
        name: data.name ?? prev.name,
        inn: data.inn ?? prev.inn,
        kpp: data.kpp ?? prev.kpp,
        ogrn: data.ogrn ?? prev.ogrn,
        address: data.address ?? prev.address,
        phone: data.phone ?? prev.phone,
        email: data.email ?? prev.email,
        bank: prev.bank,
      }));
      setErrors({});
    } catch (e) {
      setDadataLoading(false);
      setDadataError('Не удалось получить данные. Проверьте соединение');
      console.error('[DaData]', e);
    }
  }

  const SAVE_TIMEOUT_MS = 15000;
  const SAVE_TIMEOUT_MSG = 'Сохранение заняло слишком долго. Проверьте соединение.';

  async function handleSave(e) {
    if (e?.preventDefault) e.preventDefault();
    setSaveError('');

    try {
      if (!user?.id) {
        setSaveError('Нет данных пользователя. Обновите страницу.');
        return;
      }
      setSubmitted(true);
      const errs = validate(form);
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;

      setSaving(true);
      const timeoutId = setTimeout(() => {
        setSaveError(SAVE_TIMEOUT_MSG);
        setSaving(false);
      }, SAVE_TIMEOUT_MS);

      try {
        if (editOrg) {
          const { data: res, error: err } = await callEdgeFunction('organizations-update', {
            id: editOrg.id,
            form,
          });
          clearTimeout(timeoutId);
          if (err) throw new Error(err.message);
          const updated = res?.data;
          setOrgs(prev =>
            prev.map(o => (o.id === editOrg.id ? (updated || { ...form, id: editOrg.id }) : o)),
          );
        } else {
          const { error: err } = await callEdgeFunction('organizations-create', form);
          clearTimeout(timeoutId);
          if (err) throw new Error(err.message);
          await fetchOrgs();
        }
        setModalOpen(false);
      } catch (inner) {
        clearTimeout(timeoutId);
        throw inner;
      } finally {
        clearTimeout(timeoutId);
        setSaving(false);
      }
    } catch (e) {
      setSaveError(e?.message || 'Не удалось сохранить');
    }
  }

  async function handleDelete(id) {
    setActionError(null);
    const { error: err } = await callEdgeFunction('organizations-delete', { id });

    if (err) {
      setActionError(err.message);
    } else {
      setOrgs(prev => prev.filter(o => o.id !== id));
    }
  }

  async function handleSetMain(id) {
    setActionError(null);
    const { error: err } = await callEdgeFunction('organizations-set-main', { id });

    if (err) {
      setActionError(err.message);
    } else {
      setOrgs(prev => prev.map(o => ({ ...o, isMain: o.id === id })));
    }
  }

  const hasErrors = submitted && Object.keys(errors).length > 0;

  return (
    <DashboardLayout title="Организации">

      {actionError && (
        <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} className="mb-4" />
      )}

      <div className="flex justify-between items-center mb-5">
        <p className="text-sm text-slate-500">
          {loadingList ? '...' : `${orgs.length} организаций`}
        </p>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          Добавить организацию
        </button>
      </div>

      {/* Состояния загрузки / ошибки / пусто */}
      {loadingList ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 flex items-center justify-center gap-2 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
          <span>Загрузка...</span>
        </div>
      ) : listError ? (
        <div className="bg-white rounded-xl border border-red-200 py-16 flex flex-col items-center justify-center gap-3 text-red-500">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{listError}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchOrgs()}
            className="text-sm bg-red-50 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
          >
            Повторить
          </button>
        </div>
      ) : orgs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center text-slate-400">
          <Building2 size={40} className="mx-auto mb-3 text-slate-200" />
          <p>Нет организаций. Добавьте первую!</p>
        </div>
      ) : (
        /* Список карточек */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orgs.map(org => (
            <div
              key={org.id}
              className={`bg-white rounded-xl border p-5 relative ${
                org.isMain ? 'border-blue-300 shadow-sm shadow-blue-100' : 'border-slate-200'
              }`}
            >
              {org.isMain && (
                <span className="absolute top-4 right-4 text-xs bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Star size={11} className="fill-blue-600" />
                  Основная
                </span>
              )}

              <div className="flex items-start gap-3 mb-4">
                <div className="p-2.5 bg-slate-100 rounded-xl">
                  <Building2 size={20} className="text-slate-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{org.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">ИНН: {org.inn}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-500 mb-4">
                {org.kpp && <div><span className="text-slate-400">КПП:</span> {org.kpp}</div>}
                {org.ogrn && <div><span className="text-slate-400">ОГРН:</span> {org.ogrn}</div>}
                {org.phone && <div><span className="text-slate-400">Тел:</span> {org.phone}</div>}
                {org.email && <div><span className="text-slate-400">Email:</span> {org.email}</div>}
              </div>
              {org.address && (
                <p className="text-xs text-slate-400 mb-4 truncate">{org.address}</p>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(org)}
                  className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <Edit2 size={13} />
                  Редактировать
                </button>
                {!org.isMain && (
                  <button
                    onClick={() => handleSetMain(org.id)}
                    className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-amber-600 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Star size={13} />
                    Сделать основной
                  </button>
                )}
                <button
                  onClick={() => handleDelete(org.id)}
                  className="ml-auto text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== Модалка добавления/редактирования ===== */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editOrg ? 'Редактировать организацию' : 'Добавить организацию'}
        size="lg"
      >
        {/* Вкладки */}
        <div className="flex gap-1 mb-6 border-b border-slate-100">
          {[
            { id: 'requisites', label: 'Реквизиты' },
            { id: 'bank', label: 'Банковские данные' },
            { id: 'contacts', label: 'Контакты' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
          {allowFakeOrgData && (
            <button
              type="button"
              onClick={() => { setForm({ ...fakeOrgForm }); setErrors({}); }}
              className="ml-auto text-xs text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Заполнить фейковыми данными
            </button>
          )}
        </div>

        {/* Вкладка: Реквизиты */}
        {activeTab === 'requisites' && (
          <div className="space-y-4">
            <Field label="Название организации" error={errors.name}>
              <input
                type="text"
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                placeholder="ООО «Название»"
                className={inputClass(errors.name)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="ИНН" error={errors.inn || dadataError}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.inn}
                    onChange={e => { setField('inn', e.target.value); setDadataError(''); }}
                    placeholder="7701234567"
                    maxLength={12}
                    className={inputClass(errors.inn || dadataError)}
                  />
                  <button
                    type="button"
                    disabled={!innValidForDadata || dadataLoading}
                    onClick={handleFillFromDaData}
                    className="shrink-0 px-3 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-50 flex items-center gap-1.5"
                    title="Заполнить реквизиты по ИНН из ЕГРЮЛ"
                  >
                    {dadataLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    {dadataLoading ? 'Загрузка...' : 'Заполнить автоматически'}
                  </button>
                </div>
              </Field>

              <Field label="КПП" error={errors.kpp}>
                <input
                  type="text"
                  value={form.kpp}
                  onChange={e => setField('kpp', e.target.value)}
                  placeholder="770101001"
                  maxLength={9}
                  className={inputClass(errors.kpp)}
                />
              </Field>
            </div>

            <Field label="ОГРН" error={errors.ogrn}>
              <input
                type="text"
                value={form.ogrn}
                onChange={e => setField('ogrn', e.target.value)}
                placeholder="1027700132195"
                maxLength={15}
                className={inputClass(errors.ogrn)}
              />
            </Field>

            <Field label="Юридический адрес" error={errors.address}>
              <input
                type="text"
                value={form.address}
                onChange={e => setField('address', e.target.value)}
                placeholder="г. Москва, ул. Тверская, д. 1"
                className={inputClass(errors.address)}
              />
            </Field>

            {dadataWarnings.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <ul className="list-disc list-inside space-y-0.5">
                  {dadataWarnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Вкладка: Банк */}
        {activeTab === 'bank' && (
          <div className="space-y-4">
            <Field label="БИК" error={errors.bik}>
              <input
                type="text"
                value={form.bank?.bik || ''}
                onChange={e => setBankField('bik', e.target.value)}
                placeholder="044525225"
                maxLength={9}
                className={inputClass(errors.bik)}
              />
            </Field>

            <Field label="Банк" error={errors.bankName}>
              <input
                type="text"
                value={form.bank?.bankName || ''}
                onChange={e => setBankField('bankName', e.target.value)}
                placeholder="ПАО Сбербанк"
                className={inputClass(errors.bankName)}
              />
            </Field>

            <Field label="Расчётный счёт" error={errors.checkingAccount}>
              <input
                type="text"
                value={form.bank?.checkingAccount || ''}
                onChange={e => setBankField('checkingAccount', e.target.value)}
                placeholder="40702810938000012345"
                maxLength={20}
                className={inputClass(errors.checkingAccount)}
              />
            </Field>

            <Field label="Корр. счёт" error={errors.correspondentAccount}>
              <input
                type="text"
                value={form.bank?.correspondentAccount || ''}
                onChange={e => setBankField('correspondentAccount', e.target.value)}
                placeholder="30101810400000000225"
                maxLength={20}
                className={inputClass(errors.correspondentAccount)}
              />
            </Field>
          </div>
        )}

        {/* Вкладка: Контакты */}
        {activeTab === 'contacts' && (
          <div className="space-y-4">
            <Field label="Телефон" error={errors.phone}>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setField('phone', e.target.value)}
                placeholder="+7 (495) 123-45-67"
                className={inputClass(errors.phone)}
              />
            </Field>

            <Field label="Email" error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={e => setField('email', e.target.value)}
                placeholder="info@company.ru"
                className={inputClass(errors.email)}
              />
            </Field>
          </div>
        )}

        {/* Общий блок ошибок формы */}
        {(hasErrors || saveError) && (
          <div className="mt-4 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle size={13} />
            <span>
              {hasErrors
                ? 'Заполните обязательные поля (проверьте все вкладки)'
                : saveError}
            </span>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            className="px-5 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave()}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
