// ============================================================
// SettingsPage — настройки профиля /dashboard/settings
// ============================================================

import { useState, useEffect } from 'react';
import { Camera, AlertTriangle, Loader2, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { invokeEdgeFunction, supabase } from '../../lib/supabase';

export default function SettingsPage() {
  const { user, profile, logout, refreshProfile } = useAuth();

  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [pwSaved, setPwSaved] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');

  const [notifications, setNotifications] = useState({
    docReady: true,
    signExpiry: true,
    billing: false,
    news: false,
  });

  // Инициализируем форму из профиля после его загрузки
  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name ?? '',
        email: profile.email ?? '',
        phone: profile.phone ?? '',
      });
    }
  }, [profile]);

  async function handleProfileSave(e) {
    e.preventDefault();
    setProfileError('');
    setProfileSaving(true);

    const { error: err } = await invokeEdgeFunction('profile-update', {
      name: profileForm.name,
      email: profileForm.email,
      phone: profileForm.phone || null,
    });

    if (err) {
      setProfileError(err.message);
    } else {
      await refreshProfile();
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    }
    setProfileSaving(false);
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    setPwError('');

    if (passwords.next !== passwords.confirm) {
      setPwError('Пароли не совпадают');
      return;
    }
    if (passwords.next.length < 8) {
      setPwError('Минимум 8 символов');
      return;
    }

    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.next });

    if (error) {
      setPwError(error.message);
    } else {
      setPwSaved(true);
      setPasswords({ current: '', next: '', confirm: '' });
      setTimeout(() => setPwSaved(false), 2500);
    }
    setPwSaving(false);
  }

  return (
    <DashboardLayout title="Настройки профиля">
      <div className="max-w-2xl space-y-6">

        {/* ===== Профиль ===== */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-5">Профиль</h2>

          {/* Аватар */}
          <div className="flex items-center gap-4 mb-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
                {profileForm.name.charAt(0) || 'U'}
              </div>
              <button className="absolute bottom-0 right-0 p-1 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50">
                <Camera size={12} className="text-slate-500" />
              </button>
            </div>
            <div>
              <p className="font-medium text-slate-800">{profileForm.name || '—'}</p>
              <p className="text-sm text-slate-400">Изменить фото</p>
            </div>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Имя</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Телефон</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {profileError && (
              <p className="text-sm text-red-500 flex items-center gap-1.5">
                <AlertCircle size={14} /> {profileError}
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={profileSaving}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {profileSaving && <Loader2 size={14} className="animate-spin" />}
                {profileSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
              {profileSaved && <span className="text-sm text-green-600">✓ Сохранено</span>}
            </div>
          </form>
        </div>

        {/* ===== Смена пароля ===== */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-5">Смена пароля</h2>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            {[
              { label: 'Текущий пароль', field: 'current' },
              { label: 'Новый пароль', field: 'next' },
              { label: 'Повторите новый пароль', field: 'confirm' },
            ].map(item => (
              <div key={item.field}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{item.label}</label>
                <input
                  type="password"
                  value={passwords[item.field]}
                  onChange={e => setPasswords(p => ({ ...p, [item.field]: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}

            {pwError && (
              <p className="text-sm text-red-500 flex items-center gap-1.5">
                <AlertCircle size={14} /> {pwError}
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={pwSaving}
                className="bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {pwSaving && <Loader2 size={14} className="animate-spin" />}
                {pwSaving ? 'Изменение...' : 'Изменить пароль'}
              </button>
              {pwSaved && <span className="text-sm text-green-600">✓ Пароль изменён</span>}
            </div>
          </form>
        </div>

        {/* ===== Уведомления (UI-only, без БД) ===== */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-5">Уведомления</h2>
          <div className="space-y-3">
            {[
              { key: 'docReady', label: 'Документ готов к скачиванию' },
              { key: 'signExpiry', label: 'Истекает срок действия ЭЦП' },
              { key: 'billing', label: 'Оплата и счета' },
              { key: 'news', label: 'Новости и обновления' },
            ].map(item => (
              <label key={item.key} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg cursor-pointer">
                <span className="text-sm text-slate-700">{item.label}</span>
                <div
                  onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key] }))}
                  className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${notifications[item.key] ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifications[item.key] ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* ===== Опасная зона ===== */}
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-red-500" />
            <h2 className="font-semibold text-red-700">Опасная зона</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Удаление аккаунта необратимо. Все документы и данные будут удалены.
          </p>
          <button className="text-sm border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">
            Удалить аккаунт
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
