// ============================================================
// NotFoundPage — страница 404
// ============================================================

import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
        {/* Иллюстрация */}
        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          <FileQuestion size={48} className="text-blue-400" />
        </div>

        <h1 className="text-8xl font-black text-blue-100 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">Страница не найдена</h2>
        <p className="text-slate-500 max-w-md mb-8">
          Похоже, такой страницы не существует. Возможно, она была удалена или вы ввели неверный адрес.
        </p>

        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft size={18} />
          На главную
        </button>
      </div>
    </div>
  );
}
