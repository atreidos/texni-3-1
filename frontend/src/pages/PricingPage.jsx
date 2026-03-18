// ============================================================
// PricingPage — публичная страница тарифов /pricing
// ============================================================

import Header from '../components/Header';
import PricingCard from '../components/PricingCard';
import { mockPlans } from '../data/mockData';
import { Check, X } from 'lucide-react';

// Детальная таблица сравнения функций
const comparisonFeatures = [
  { label: 'Документов в месяц', free: '5', pro: '50', business: 'Без ограничений' },
  { label: 'Автозаполнение полей', free: true, pro: true, business: true },
  { label: 'Скачивание документа', free: true, pro: true, business: true },
  { label: 'ИИ-заполнение', free: false, pro: true, business: true },
  { label: 'Электронная подпись (ЭЦП)', free: false, pro: true, business: true },
  { label: 'Сохранение организаций', free: false, pro: '3', business: 'Без ограничений' },
  { label: 'История документов', free: false, pro: true, business: true },
  { label: 'Приоритетная поддержка', free: false, pro: false, business: true },
  { label: 'API доступ', free: false, pro: false, business: true },
];

// Вопросы и ответы
const faqs = [
  {
    q: 'Можно ли использовать DocFlow без оплаты?',
    a: 'Да, бесплатный тариф позволяет обрабатывать до 5 документов в месяц без каких-либо ограничений по времени.',
  },
  {
    q: 'Как работает оплата?',
    a: 'Оплата списывается ежемесячно. Вы можете отменить подписку в любой момент — доступ сохраняется до конца оплаченного периода.',
  },
  {
    q: 'Есть ли пробный период для платных тарифов?',
    a: 'Да, при первой подписке на тариф Про вы получаете 14 дней бесплатно.',
  },
  {
    q: 'Как работает ЭЦП?',
    a: 'Вы загружаете свой сертификат ЭЦП (PKCS#12), подписываете документ в браузере. Подпись имеет юридическую силу по 63-ФЗ.',
  },
];

function CellValue({ value }) {
  if (value === true) return <Check size={18} className="text-green-500 mx-auto" />;
  if (value === false) return <X size={18} className="text-slate-300 mx-auto" />;
  return <span className="text-sm text-slate-700">{value}</span>;
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Заголовок */}
      <section className="py-16 bg-slate-50 text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Тарифы и цены</h1>
        <p className="text-slate-500 max-w-xl mx-auto">
          Начните бесплатно. Платите только за то, что используете.
        </p>
      </section>

      {/* Карточки тарифов */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockPlans.map(plan => (
              <PricingCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      {/* Таблица сравнения */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center">Подробное сравнение</h2>

          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Функция</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-slate-600">Бесплатно</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-blue-600 bg-blue-50">Про</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-slate-600">Бизнес</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="px-6 py-3.5 text-sm text-slate-700">{row.label}</td>
                    <td className="px-6 py-3.5 text-center"><CellValue value={row.free} /></td>
                    <td className="px-6 py-3.5 text-center bg-blue-50/50"><CellValue value={row.pro} /></td>
                    <td className="px-6 py-3.5 text-center"><CellValue value={row.business} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center">Вопросы и ответы</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-slate-200 rounded-xl p-6">
                <h3 className="font-semibold text-slate-800 mb-2">{faq.q}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
