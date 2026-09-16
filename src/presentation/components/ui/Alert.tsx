type AlertProps = {
  tone?: 'danger' | 'success' | 'info' | 'warning'
  children: string
}

const toneClass = {
  danger: 'border-[var(--color-danger)] bg-red-50 text-[var(--color-danger)]',
  success: 'border-[var(--color-success)] bg-emerald-50 text-[var(--color-success)]',
  warning: 'border-[var(--color-warning)] bg-amber-50 text-[var(--color-text)]',
  info: 'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text)]',
}

export function Alert({ tone = 'info', children }: AlertProps) {
  const live = tone === 'danger' ? 'assertive' : 'polite'
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      aria-live={live}
      className={`rounded-[var(--radius-md)] border px-3 py-2 text-sm ${toneClass[tone]}`}
    >
      {children}
    </div>
  )
}
