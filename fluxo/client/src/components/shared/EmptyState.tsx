interface EmptyStateProps {
  message?: string;
  description?: string;
  icon?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({
  message = 'Nada por aqui ainda',
  description,
  icon = '✦',
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center select-none">
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-2xl">
          {icon}
        </div>
        <div className="absolute inset-0 rounded-2xl bg-brand-primary/5 blur-xl -z-10" />
      </div>
      <p className="text-sm font-semibold text-white/80 mb-1.5">{message}</p>
      {description && (
        <p className="text-xs text-muted max-w-[220px] leading-relaxed">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 btn-primary text-xs px-5 py-2.5"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
