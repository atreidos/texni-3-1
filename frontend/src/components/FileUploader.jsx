// ============================================================
// FileUploader — зона загрузки файлов с drag-and-drop
// onFileSelect(file) — коллбэк при выборе файла
// ============================================================

import { useState, useRef } from 'react';
import { Upload, FileText } from 'lucide-react';

const SUPPORTED_FORMATS = ['.docx', '.pdf'];

export default function FileUploader({ onFileSelect }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Обработка drag-and-drop
  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  }

  function handleFileInput(e) {
    const file = e.target.files[0];
    if (file) onFileSelect(file);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      {/* Зона drag-and-drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className={`p-4 rounded-full ${isDragging ? 'bg-blue-100' : 'bg-slate-100'}`}>
          <Upload size={32} className={isDragging ? 'text-blue-600' : 'text-slate-500'} />
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold text-slate-700">
            {isDragging ? 'Отпустите файл' : 'Перетащите документ сюда'}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            или <span className="text-blue-600 font-medium">нажмите для выбора файла</span>
          </p>
        </div>

        {/* Скрытый input для выбора файла */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.pdf"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {/* Список поддерживаемых форматов */}
      <div className="mt-6 flex items-center gap-3">
        <span className="text-xs text-slate-500">Поддерживаемые форматы:</span>
        {SUPPORTED_FORMATS.map(fmt => (
          <span
            key={fmt}
            className="flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full"
          >
            <FileText size={12} />
            {fmt}
          </span>
        ))}
      </div>

      {/* Подсказка для демо */}
      <p className="mt-4 text-xs text-slate-400">
        Demo: можно выбрать любой файл — покажем интерфейс редактора
      </p>
    </div>
  );
}
