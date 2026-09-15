type AlertProps = {
  tone?: 'danger' | 'success' | 'info'
  children: string
}

const toneClass = {
  danger: 'border-[var(--color-danger)] bg-red-50 text-[var(--color-danger)]',
  success: 'border-[var(--color-success)] bg-emerald-50 text-[var(--color-success)]',
  info: 'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text)]',
}

export function Alert({ tone = 'info', children }: AlertProps) {
  return (
    <div className={`rounded-[var(--radius-md)] border px-3 py-2 text-sm ${toneClass[tone]}`}>
      {children}
    </div>
  )
}
