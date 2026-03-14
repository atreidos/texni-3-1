// ============================================================
// OrganizationsPage — управление организациями /dashboard/organizations
// ============================================================

import { useState } from 'react';
import { Plus, Edit2, Trash2, Star, Building2 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import { mockOrganizations } from '../../data/mockData';

// Начальное состояние формы новой организации
const emptyOrg = {
  name: '', inn: '', kpp: '', ogrn: '', address: '', phone: '', email: '',
  bank: { bik: '', bankName: '', checkingAccount: '', correspondentAccount: '' },
};

// ============================================================
// Правила валидации по российским форматам реквизитов
// ============================================================
function validate(form) {
  const errors = {};

  // Название — обязательное
  if (!form.name.trim()) {
    errors.name = 'Введите название организации';
  }

  // ИНН — 10 цифр (юрлицо) или 12 цифр (ИП), только цифры
  if (!form.inn) {
    errors.inn = 'Введите ИНН';
  } else if (!/^\d{10}$|^\d{12}$/.test(form.inn)) {
    errors.inn = 'ИНН — 10 цифр (юрлицо) или 12 цифр (ИП)';
  }

  // КПП — 9 цифр, необязательное (только если заполнено)
  if (form.kpp && !/^\d{9}$/.test(form.kpp)) {
    errors.kpp = 'КПП — 9 цифр';
  }

  // ОГРН — 13 цифр (юрлицо) или 15 цифр (ИП), необязательное
  if (form.ogrn && !/^\d{13}$|^\d{15}$/.test(form.ogrn)) {
    errors.ogrn = 'ОГРН — 13 цифр (юрлицо) или 15 цифр (ИП)';
  }

  // БИК — 9 цифр, необязательное
  if (form.bank?.bik && !/^\d{9}$/.test(form.bank.bik)) {
    errors.bik = 'БИК — 9 цифр';
  }

  // Расчётный счёт — 20 цифр, необязательное
  if (form.bank?.checkingAccount && !/^\d{20}$/.test(form.bank.checkingAccount)) {
    errors.checkingAccount = 'Расчётный счёт — 20 цифр';
  }

  // Корр. счёт — 20 цифр, необязательное
  if (form.bank?.correspondentAccount && !/^\d{20}$/.test(form.bank.correspondentAccount)) {
    errors.correspondentAccount = 'Корр. счёт — 20 цифр';
  }

  return errors;
}

// Вспомогательный компонент: поле с подсветкой ошибки
function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// Стили инпута — красная рамка при ошибке
function inputClass(hasError) {
  return `w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
    hasError
      ? 'border-red-400 focus:ring-red-400'
      : 'border-slate-200 focus:ring-blue-500'
  }`;
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState(mockOrganizations);
  const [modalOpen, setModalOpen] = useState(false);
  const [editOrg, setEditOrg] = useState(null);
  const [form, setForm] = useState(emptyOrg);
  const [errors, setErrors] = useState({});       // ошибки валидации
  const [submitted, setSubmitted] = useState(false); // была ли попытка отправки
  const [activeTab, setActiveTab] = useState('requisites');

  function openAdd() {
    setEditOrg(null);
    setForm(emptyOrg);
    setErrors({});
    setSubmitted(false);
    setActiveTab('requisites');
    setModalOpen(true);
  }

  function openEdit(org) {
    setEditOrg(org);
    setForm(org);
    setErrors({});
    setSubmitted(false);
    setActiveTab('requisites');
    setModalOpen(true);
  }

  // Валидируем при каждом изменении поля (только после первой попытки сохранить)
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

  function handleSave() {
    setSubmitted(true);
    const errs = validate(form);
    setErrors(errs);

    // Если есть ошибки — блокируем сохранение
    if (Object.keys(errs).length > 0) return;

    if (editOrg) {
      setOrgs(prev => prev.map(o => o.id === editOrg.id ? { ...form, id: editOrg.id } : o));
    } else {
      setOrgs(prev => [...prev, { ...form, id: Date.now(), isMain: false }]);
    }
    setModalOpen(false);
  }

  function handleDelete(id) {
    setOrgs(prev => prev.filter(o => o.id !== id));
  }

  function handleSetMain(id) {
    setOrgs(prev => prev.map(o => ({ ...o, isMain: o.id === id })));
  }

  // Есть ли ошибки после попытки сохранить
  const hasErrors = submitted && Object.keys(errors).length > 0;

  return (
    <DashboardLayout title="Организации">

      {/* Кнопка добавить */}
      <div className="flex justify-between items-center mb-5">
        <p className="text-sm text-slate-500">{orgs.length} организаций</p>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          Добавить организацию
        </button>
      </div>

      {/* Список карточек */}
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
              <Field label="ИНН" error={errors.inn}>
                <input
                  type="text"
                  value={form.inn}
                  onChange={e => setField('inn', e.target.value)}
                  placeholder="7701234567"
                  maxLength={12}
                  className={inputClass(errors.inn)}
                />
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

        {/* Общая подсказка об ошибках */}
        {hasErrors && (
          <p className="text-xs text-red-500 mt-4">
            Исправьте ошибки перед сохранением (проверьте все вкладки)
          </p>
        )}

        {/* Кнопки */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={() => setModalOpen(false)}
            className="px-5 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Сохранить
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
