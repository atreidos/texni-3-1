// ============================================================
// BillingPage — тариф и оплата /dashboard/billing
// ============================================================

import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import PricingCard from '../../components/PricingCard';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { mockPlans, PLAN_LABELS } from '../../data/mockData';

// Форматируем дату оплаты
function formatDate(iso) {
  if (!iso) return '—';
  return iso.split('T')[0];
}

// Статус платежа → метка
function PaymentStatusBadge({ status }) {
  if (status === 'success') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
        <CheckCircle size={12} />
        Оплачен
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full">
        Ожидает
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
      Ошибка
    </span>
  );
}

export default function BillingPage() {
  const { user, profile } = useAuth();
  const [showCardForm, setShowCardForm] = useState(false);

  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [paymentsError, setPaymentsError] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    async function fetchPayments() {
      setLoadingPayments(true);
      setPaymentsError(null);
      const { data, error: err } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (err) {
        setPaymentsError(err.message);
      } else {
        setPayments(data || []);
      }
      setLoadingPayments(false);
    }

    fetchPayments();
  }, [user?.id]);

  const docsUsed = profile?.docs_used ?? 0;
  const docsLimit = profile?.docs_limit ?? 1;
  const plan = profile?.plan ?? 'free';

  return (
    <DashboardLayout title="Тариф и оплата">

      {/* Текущий тариф */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Текущий тариф</p>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-800">
                {PLAN_LABELS[plan] ?? '—'}
              </h2>
              <span className="text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2.5 py-1 rounded-full">
                {plan.toUpperCase()}
              </span>
            </div>
            {profile?.plan_expires && (
              <p className="text-sm text-slate-500 mt-1">
                Действует до: <strong>{profile.plan_expires}</strong>
              </p>
            )}
          </div>

          {/* Использование */}
          <div className="min-w-48">
            <p className="text-xs text-slate-400 mb-2">Документов использовано</p>
            <div className="h-2.5 bg-slate-100 rounded-full mb-1">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.min((docsUsed / docsLimit) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">{docsUsed} из {docsLimit}</p>
          </div>
        </div>
      </div>

      {/* Карточки тарифов */}
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Изменить тариф</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {mockPlans.map(p => (
          <PricingCard key={p.id} plan={p} currentPlan={plan} />
        ))}
      </div>

      {/* Способ оплаты */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Способ оплаты</h3>
          <button
            onClick={() => setShowCardForm(!showCardForm)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showCardForm ? 'Отмена' : '+ Добавить карту'}
          </button>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
          <CreditCard size={20} className="text-slate-400" />
          <div>
            <p className="text-sm font-medium text-slate-700">•••• •••• •••• 4242</p>
            <p className="text-xs text-slate-400">Visa · 09/28</p>
          </div>
          <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Основная</span>
        </div>

        {showCardForm && (
          <div className="mt-4 p-4 border border-slate-200 rounded-xl space-y-3">
            <p className="text-sm text-slate-500 text-center py-4">
              Форма оплаты (здесь будет интеграция с платёжным сервисом)
            </p>
          </div>
        )}
      </div>

      {/* История платежей */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">История платежей</h3>
        </div>

        {loadingPayments ? (
          <div className="py-12 flex items-center justify-center gap-2 text-slate-400">
            <Loader2 size={18} className="animate-spin" />
            <span>Загрузка...</span>
          </div>
        ) : paymentsError ? (
          <div className="py-12 flex items-center justify-center gap-2 text-red-500">
            <AlertCircle size={16} />
            <span>{paymentsError}</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">История платежей пуста</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Дата</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Тариф</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Сумма</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-sm text-slate-600">{formatDate(p.paid_at ?? p.created_at)}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{PLAN_LABELS[p.plan] ?? p.plan}</td>
                  <td className="px-5 py-3 text-sm font-medium text-slate-800">{Number(p.amount).toLocaleString('ru-RU')} ₽</td>
                  <td className="px-5 py-3">
                    <PaymentStatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
