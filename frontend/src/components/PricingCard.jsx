// ============================================================
// PricingCard — карточка тарифного плана
// Используется на лендинге, /pricing, /dashboard/billing
// ============================================================

import { Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PricingCard({ plan, currentPlan }) {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const isCurrent = currentPlan === plan.id;
  const isPopular = plan.popular;

  function handleSelect() {
    if (!isLoggedIn) {
      navigate('/auth/register');
    } else {
      navigate('/dashboard/billing');
    }
  }

  const borderClass = isPopular
    ? 'border-2 border-blue-500 shadow-lg shadow-blue-100'
    : 'border border-slate-200';

  return (
    <div className={`bg-white rounded-2xl p-6 flex flex-col relative ${borderClass}`}>

      {/* Бейдж «Популярный» */}
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
            Популярный
          </span>
        </div>
      )}

      {/* Название и цена */}
      <div className="mb-5">
        <h3 className="text-lg font-bold text-slate-800 mb-1">{plan.name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-slate-900">
            {plan.price === 0 ? 'Бесплатно' : `${plan.price} ₽`}
          </span>
          {plan.price > 0 && (
            <span className="text-sm text-slate-500">/ {plan.period}</span>
          )}
        </div>
      </div>

      {/* Список возможностей */}
      <ul className="space-y-3 flex-1 mb-6">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            {feature.included
              ? <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
              : <X size={16} className="text-slate-300 mt-0.5 shrink-0" />
            }
            <span className={feature.included ? 'text-slate-700' : 'text-slate-400'}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      {/* Кнопка выбора */}
      {isCurrent ? (
        <div className="text-center text-sm text-slate-500 py-2.5 bg-slate-50 rounded-xl">
          Текущий тариф
        </div>
      ) : (
        <button
          onClick={handleSelect}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            isPopular
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Выбрать {plan.name}
        </button>
      )}
    </div>
  );
}
