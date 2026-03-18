// ============================================================
// SignaturePage — страница ЭЦП /dashboard/signature
// Два таба: «Подписать» и «Проверить подпись»
// ============================================================

import { useState } from 'react';
import {
  Upload, PenTool, CheckCircle, XCircle,
  Shield, Download, ChevronDown
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

// Заглушка сертификатов ЭЦП
const mockCertificates = [
  { id: 1, name: 'Петров И.И.', org: 'ООО «Альфа Медиа»', inn: '7701234567', expires: '2027-05-15' },
];

export default function SignaturePage() {
  const [activeTab, setActiveTab] = useState('sign');

  // Состояния вкладки "Подписать"
  const [signFile, setSignFile] = useState(null);
  const [selectedCert, setSelectedCert] = useState(mockCertificates[0]);
  const [signStatus, setSignStatus] = useState(null); // null | 'loading' | 'success'

  // Состояния вкладки "Проверить"
  const [verifyFile, setVerifyFile] = useState(null);
  const [sigFile, setSigFile] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null); // null | 'valid' | 'invalid'

  function handleSign() {
    if (!signFile) return;
    setSignStatus('loading');
    setTimeout(() => setSignStatus('success'), 1500); // имитация подписания
  }

  function handleVerify() {
    if (!verifyFile) return;
    setVerifyResult('loading');
    setTimeout(() => setVerifyResult('valid'), 1500); // имитация проверки
  }

  return (
    <DashboardLayout title="Электронная подпись (ЭЦП)">

      {/* Табы */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {[
          { id: 'sign', label: 'Подписать документ', icon: PenTool },
          { id: 'verify', label: 'Проверить подпись', icon: Shield },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== Вкладка: Подписать ===== */}
      {activeTab === 'sign' && (
        <div className="max-w-2xl space-y-5">

          {/* Загрузка документа */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3">Документ для подписания</h3>
            {!signFile ? (
              <label className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-slate-50 transition-colors">
                <Upload size={28} className="text-slate-400" />
                <span className="text-sm text-slate-500">Выберите .docx или .pdf</span>
                <input type="file" accept=".docx,.pdf" className="hidden" onChange={e => setSignFile(e.target.files[0])} />
              </label>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <PenTool size={18} className="text-blue-600" />
                <span className="text-sm flex-1 truncate">{signFile.name}</span>
                <button onClick={() => { setSignFile(null); setSignStatus(null); }} className="text-slate-400 hover:text-red-500 text-xs">
                  Удалить
                </button>
              </div>
            )}
          </div>

          {/* Выбор сертификата */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3">Сертификат ЭЦП</h3>
            <div className="space-y-2">
              {mockCertificates.map(cert => (
                <label
                  key={cert.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCert?.id === cert.id ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="cert"
                    checked={selectedCert?.id === cert.id}
                    onChange={() => setSelectedCert(cert)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{cert.name}</p>
                    <p className="text-xs text-slate-400">{cert.org} · ИНН {cert.inn}</p>
                    <p className="text-xs text-slate-400">Действует до: {cert.expires}</p>
                  </div>
                </label>
              ))}
              <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 px-3 py-2">
                <Upload size={14} />
                Добавить сертификат (.p12 / .pfx)
              </button>
            </div>
          </div>

          {/* Кнопка подписания */}
          <button
            onClick={handleSign}
            disabled={!signFile || signStatus === 'loading'}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PenTool size={18} />
            {signStatus === 'loading' ? 'Подписываем...' : 'Подписать документ'}
          </button>

          {/* Результат подписания */}
          {signStatus === 'success' && (
            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
              <CheckCircle size={20} className="text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-800">Документ успешно подписан</p>
                <p className="text-sm text-green-700 mt-1">Подпись добавлена. Скачайте подписанный файл.</p>
                <button className="flex items-center gap-1.5 mt-3 text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  <Download size={15} />
                  Скачать подписанный файл
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== Вкладка: Проверить подпись ===== */}
      {activeTab === 'verify' && (
        <div className="max-w-2xl space-y-5">

          {/* Загрузка документа */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3">Подписанный документ</h3>
            <label className="flex items-center gap-3 p-3 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-slate-50 transition-colors">
              <Upload size={20} className="text-slate-400" />
              <span className="text-sm text-slate-500">
                {verifyFile ? verifyFile.name : 'Загрузить документ (.docx / .pdf)'}
              </span>
              <input type="file" accept=".docx,.pdf" className="hidden" onChange={e => setVerifyFile(e.target.files[0])} />
            </label>
          </div>

          {/* Файл подписи (опционально) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-1">Файл подписи</h3>
            <p className="text-xs text-slate-400 mb-3">Необязательно, если подпись встроена в документ</p>
            <label className="flex items-center gap-3 p-3 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-slate-50 transition-colors">
              <Upload size={18} className="text-slate-400" />
              <span className="text-sm text-slate-400">
                {sigFile ? sigFile.name : 'Загрузить файл подписи (.sig / .p7s)'}
              </span>
              <input type="file" accept=".sig,.p7s" className="hidden" onChange={e => setSigFile(e.target.files[0])} />
            </label>
          </div>

          {/* Кнопка проверки */}
          <button
            onClick={handleVerify}
            disabled={!verifyFile || verifyResult === 'loading'}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Shield size={18} />
            {verifyResult === 'loading' ? 'Проверяем...' : 'Проверить подпись'}
          </button>

          {/* Протокол проверки */}
          {verifyResult === 'valid' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2 p-4 bg-green-50 border-b border-green-100">
                <CheckCircle size={20} className="text-green-500" />
                <span className="font-semibold text-green-800">Подпись действительна</span>
              </div>
              <div className="p-5 space-y-3">
                <Row label="Владелец сертификата" value="Петров Иван Иванович" />
                <Row label="ИНН" value="770198765432" />
                <Row label="Организация" value="ООО «Альфа Медиа»" />
                <Row label="Срок действия" value="до 15.05.2027" />
                <Row label="Дата подписания" value="11.03.2026 14:32:05" />
                <Row label="Хэш документа (SHA-256)" value="a3f1b2c4..." mono />
              </div>
              <div className="px-5 pb-5">
                <button className="flex items-center gap-2 text-sm border border-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <Download size={15} />
                  Скачать протокол PDF
                </button>
              </div>
            </div>
          )}

          {verifyResult === 'invalid' && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <XCircle size={20} className="text-red-500 shrink-0" />
              <div>
                <p className="font-semibold text-red-800">Подпись недействительна</p>
                <p className="text-sm text-red-600 mt-1">Документ был изменён после подписания или сертификат отозван.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

// Вспомогательный компонент строки протокола
function Row({ label, value, mono }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      <span className={`text-sm text-slate-800 text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
