// ============================================================
// StatusBadge — бейдж статуса документа
// status: 'draft' | 'filled' | 'signed'
// ============================================================

const statusConfig = {
  draft:  { label: 'Черновик', classes: 'bg-slate-100 text-slate-600' },
  filled: { label: 'Заполнен', classes: 'bg-blue-100 text-blue-700' },
  signed: { label: 'Подписан', classes: 'bg-green-100 text-green-700' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.draft;
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${config.classes}`}>
      {config.label}
    </span>
  );
}
