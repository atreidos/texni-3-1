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

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState(mockOrganizations);
  const [modalOpen, setModalOpen] = useState(false);
  const [editOrg, setEditOrg] = useState(null);    // null = добавление, объект = редактирование
  const [form, setForm] = useState(emptyOrg);
  const [activeTab, setActiveTab] = useState('requisites'); // вкладка в модалке

  function openAdd() {
    setEditOrg(null);
    setForm(emptyOrg);
    setActiveTab('requisites');
    setModalOpen(true);
  }

  function openEdit(org) {
    setEditOrg(org);
    setForm(org);
    setActiveTab('requisites');
    setModalOpen(true);
  }

  function handleSave() {
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

  function setField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function setBankField(field, value) {
    setForm(prev => ({ ...prev, bank: { ...prev.bank, [field]: value } }));
  }

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
            {/* Бейдж "Основная" */}
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

            {/* Кнопки действий */}
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
        <div className="flex gap-1 mb-6 border-b border-slate-100 pb-0">
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Название организации</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                placeholder="ООО «Название»"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">ИНН</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.inn}
                    onChange={e => setField('inn', e.target.value)}
                    placeholder="7701234567"
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-500 hover:bg-slate-50 whitespace-nowrap"
                    title="Найти по ИНН через ЕГРЮЛ (заглушка)"
                  >
                    Найти
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">КПП</label>
                <input
                  type="text"
                  value={form.kpp}
                  onChange={e => setField('kpp', e.target.value)}
                  placeholder="770101001"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">ОГРН</label>
              <input
                type="text"
                value={form.ogrn}
                onChange={e => setField('ogrn', e.target.value)}
                placeholder="1027700132195"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Юридический адрес</label>
              <input
                type="text"
                value={form.address}
                onChange={e => setField('address', e.target.value)}
                placeholder="г. Москва, ул. Тверская, д. 1"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Вкладка: Банк */}
        {activeTab === 'bank' && (
          <div className="space-y-4">
            {[
              { label: 'БИК', field: 'bik', placeholder: '044525225' },
              { label: 'Банк', field: 'bankName', placeholder: 'ПАО Сбербанк' },
              { label: 'Расчётный счёт', field: 'checkingAccount', placeholder: '40702810938000012345' },
              { label: 'Корр. счёт', field: 'correspondentAccount', placeholder: '30101810400000000225' },
            ].map(item => (
              <div key={item.field}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{item.label}</label>
                <input
                  type="text"
                  value={form.bank?.[item.field] || ''}
                  onChange={e => setBankField(item.field, e.target.value)}
                  placeholder={item.placeholder}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        )}

        {/* Вкладка: Контакты */}
        {activeTab === 'contacts' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Телефон</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setField('phone', e.target.value)}
                placeholder="+7 (495) 123-45-67"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setField('email', e.target.value)}
                placeholder="info@company.ru"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
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
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Сохранить
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
