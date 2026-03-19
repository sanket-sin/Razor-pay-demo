export default function Alert({ type = 'error', children, onDismiss, className = '' }) {
  const styles =
    type === 'error'
      ? 'border-red-500/40 bg-red-950/50 text-red-200'
      : type === 'info'
        ? 'border-ink-600 bg-ink-900/80 text-slate-300'
        : 'border-emerald-500/40 bg-emerald-950/50 text-emerald-200';
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles} flex items-start justify-between gap-3 ${className}`}>
      <span>{children}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="shrink-0 text-slate-400 hover:text-white">
          ×
        </button>
      )}
    </div>
  );
}
