// ============================================================
// BillingPage — тариф и оплата /dashboard/billing
// ============================================================

import { useState } from 'react';
import { CreditCard, CheckCircle, Clock } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import PricingCard from '../../components/PricingCard';
import { mockPlans, mockPayments, mockUser } from '../../data/mockData';

export default function BillingPage() {
  const [showCardForm, setShowCardForm] = useState(false);

  return (
    <DashboardLayout title="Тариф и оплата">

      {/* Текущий тариф */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Текущий тариф</p>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-800">Про</h2>
              <span className="text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2.5 py-1 rounded-full">
                PRO
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">Действует до: <strong>{mockUser.planExpires}</strong></p>
          </div>
          {/* Использование */}
          <div className="min-w-48">
            <p className="text-xs text-slate-400 mb-2">Документов использовано</p>
            <div className="h-2.5 bg-slate-100 rounded-full mb-1">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${(mockUser.docsUsed / mockUser.docsLimit) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">{mockUser.docsUsed} из {mockUser.docsLimit}</p>
          </div>
        </div>
      </div>

      {/* Карточки тарифов */}
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Изменить тариф</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {mockPlans.map(plan => (
          <PricingCard key={plan.id} plan={plan} currentPlan={mockUser.plan} />
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

        {/* Существующая карта (заглушка) */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
          <CreditCard size={20} className="text-slate-400" />
          <div>
            <p className="text-sm font-medium text-slate-700">•••• •••• •••• 4242</p>
            <p className="text-xs text-slate-400">Visa · 09/28</p>
          </div>
          <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Основная</span>
        </div>

        {/* Форма добавления карты (заглушка) */}
        {showCardForm && (
          <div className="mt-4 p-4 border border-slate-200 rounded-xl space-y-3">
            <p className="text-sm text-slate-500 text-center py-4">
              Форма оплаты (заглушка — здесь будет интеграция с платёжным сервисом)
            </p>
          </div>
        )}
      </div>

      {/* История платежей */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">История платежей</h3>
        </div>
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
            {mockPayments.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 text-sm text-slate-600">{p.date}</td>
                <td className="px-5 py-3 text-sm text-slate-600">{p.plan}</td>
                <td className="px-5 py-3 text-sm font-medium text-slate-800">{p.amount} ₽</td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1.5 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                    <CheckCircle size={12} />
                    Оплачен
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
