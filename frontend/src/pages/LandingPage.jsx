// ============================================================
// LandingPage — главная публичная страница /
// Секции: Hero, Возможности, Как работает, Тарифы, Отзывы, Футер
// ============================================================

import * as Sentry from '@sentry/react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Sparkles, PenTool, Building2,
  ArrowRight, Check, Star, FileText,
  ChevronRight, Zap
} from 'lucide-react';
import Header from '../components/Header';
import PricingCard from '../components/PricingCard';
import { mockPlans, mockTestimonials } from '../data/mockData';

// --- Карточки возможностей ---
const features = [
  {
    icon: FileText,
    title: 'Автозаполнение',
    desc: 'Загрузите документ — система найдёт все поля: ФИО, ИНН, даты, суммы. Заполните за секунды.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Sparkles,
    title: 'ИИ-помощник',
    desc: 'Искусственный интеллект поможет заполнить документ по контексту, даже если поля не размечены.',
    color: 'bg-purple-50 text-purple-600',
    pro: true,
  },
  {
    icon: PenTool,
    title: 'ЭЦП онлайн',
    desc: 'Подпишите документ электронной цифровой подписью прямо в браузере. Юридически значимо.',
    color: 'bg-green-50 text-green-600',
    pro: true,
  },
  {
    icon: Building2,
    title: 'Организации',
    desc: 'Сохраните реквизиты компаний и подставляйте их в документы одним кликом.',
    color: 'bg-orange-50 text-orange-600',
    pro: true,
  },
];

// --- Шаги "Как это работает" ---
const steps = [
  { num: '01', title: 'Загрузите документ', desc: 'Перетащите .docx или .pdf — без регистрации.' },
  { num: '02', title: 'Заполните поля', desc: 'Система автоматически найдёт поля. Заполните вручную или с помощью ИИ.' },
  { num: '03', title: 'Скачайте или подпишите', desc: 'Сохраните готовый документ или подпишите ЭЦП и отправьте.' },
];

// --- Логотипы клиентов (заглушки) ---
const clientLogos = ['Компания А', 'Компания Б', 'Компания В', 'Компания Г', 'Компания Д'];

// Ручная проверка Sentry: только dev + задан VITE_SENTRY_DSN (см. ARCHITECTURE.md → Sentry)
const showSentryDevTest =
  import.meta.env.DEV && Boolean(String(import.meta.env.VITE_SENTRY_DSN ?? '').trim());

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        {/* Декоративный фон */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-purple-500 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center">
          {/* Бейдж */}
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 text-sm text-blue-300 mb-6">
            <Zap size={14} />
            Заполнение документов за секунды
          </div>

          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            Документы без<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              рутины и ошибок
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10">
            Загружайте договоры, акты, счета — система автоматически найдёт поля и заполнит их.
            ИИ-помощник и ЭЦП прямо в браузере.
          </p>

          {/* Главный CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/editor')}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg shadow-lg shadow-blue-900/40"
            >
              <Upload size={20} />
              Загрузить документ
              <span className="text-blue-300 text-sm font-normal ml-1">— без регистрации</span>
            </button>
            <button
              onClick={() => navigate('/auth/register')}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg border border-white/20"
            >
              Зарегистрироваться бесплатно
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Социальное доказательство */}
          <p className="mt-8 text-slate-400 text-sm">
            Уже используют более <strong className="text-white">2 500</strong> специалистов
          </p>
        </div>
      </section>

      {/* ===== ВОЗМОЖНОСТИ ===== */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Всё что нужно для документооборота
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Один сервис вместо нескольких инструментов
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-md transition-shadow">
                <div className={`inline-flex p-3 rounded-xl mb-4 ${f.color}`}>
                  <f.icon size={24} />
                </div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-800">{f.title}</h3>
                  {f.pro && (
                    <span className="text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-0.5 rounded-full">
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== КАК ЭТО РАБОТАЕТ ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Как это работает</h2>
            <p className="text-slate-500">Три простых шага</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative text-center">
                {/* Стрелка между шагами */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-blue-100">
                    <ChevronRight size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-blue-300" />
                  </div>
                )}
                <div className="text-5xl font-black text-blue-100 mb-4">{step.num}</div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => navigate('/editor')}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Попробовать сейчас <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ===== ТАРИФЫ ===== */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Простые и честные тарифы</h2>
            <p className="text-slate-500">Начните бесплатно, масштабируйтесь по необходимости</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {mockPlans.map(plan => (
              <PricingCard key={plan.id} plan={plan} />
            ))}
          </div>

          <div className="text-center mt-8">
            <a href="/pricing" className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center gap-1">
              Сравнить все возможности <ChevronRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* ===== ОТЗЫВЫ ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Что говорят пользователи</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockTestimonials.map(t => (
              <div key={t.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                {/* Звёзды */}
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} size={16} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{t.name}</p>
                  <p className="text-slate-500 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Логотипы клиентов */}
          <div className="mt-16 text-center">
            <p className="text-sm text-slate-400 mb-6 uppercase tracking-wider">Нам доверяют</p>
            <div className="flex flex-wrap justify-center gap-8">
              {clientLogos.map((logo, i) => (
                <div key={i} className="px-6 py-3 bg-slate-100 rounded-xl text-slate-400 font-semibold text-sm">
                  {logo}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 text-white font-bold">
            <FileText size={18} />
            DocFlow
          </div>
          <p>© 2026 DocFlow. Все права защищены.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition-colors">Политика конфиденциальности</a>
            <a href="#" className="hover:text-white transition-colors">Оферта</a>
          </div>
        </div>
      </footer>

      {showSentryDevTest && (
        <div className="fixed bottom-4 right-4 z-[100] max-w-[220px] rounded-lg border border-amber-500/40 bg-slate-900/95 px-3 py-2 text-xs text-slate-200 shadow-xl backdrop-blur-sm">
          <p className="mb-2 font-medium text-amber-400">Sentry · только npm run dev</p>
          <button
            type="button"
            className="w-full rounded-md bg-amber-600 px-2 py-1.5 font-medium text-white hover:bg-amber-500"
            onClick={() => {
              Sentry.captureException(new Error('DocFlow: ручная проверка Sentry'));
              window.alert(
                'Событие отправлено.\n\nSentry → Issues → новое событие с текстом «DocFlow: ручная проверка Sentry».\nФильтр environment: development.'
              );
            }}
          >
            Отправить тест в Sentry
          </button>
        </div>
      )}
    </div>
  );
}
