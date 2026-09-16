import type { ReactNode } from 'react'

export type StatusTone = 'success' | 'warning' | 'danger' | 'muted' | 'info'

const toneClass: Record<StatusTone, string> = {
  success: 'bg-emerald-50 text-[var(--color-success)] border-emerald-200',
  warning: 'bg-amber-50 text-[var(--color-text)] border-amber-200',
  danger: 'bg-red-50 text-[var(--color-danger)] border-red-200',
  muted: 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] border-[var(--color-border)]',
  info: 'bg-[var(--color-surface-muted)] text-[var(--color-primary)] border-[var(--color-border)]',
}

type StatusBadgeProps = {
  label: string
  tone?: StatusTone
  title?: string
}

export function StatusBadge({ label, tone = 'muted', title }: StatusBadgeProps) {
  return (
    <span
      title={title}
      className={`inline-flex max-w-full items-center truncate rounded-[var(--radius-sm)] border px-2 py-0.5 text-[12px] font-medium ${toneClass[tone]}`}
    >
      {label}
    </span>
  )
}

export function fiscalStatusTone(
  status: string | null | undefined,
): StatusTone {
  switch (status) {
    case 'authorized':
      return 'success'
    case 'queued':
    case 'draft':
      return 'info'
    case 'rejected':
    case 'error':
      return 'danger'
    case 'cancelled':
      return 'muted'
    default:
      return 'muted'
  }
}

export function financialStatusTone(
  status: string,
  overdue: boolean,
): StatusTone {
  if (overdue) return 'danger'
  if (status === 'pago') return 'success'
  if (status === 'cancelado') return 'muted'
  if (status === 'pendente') return 'warning'
  return 'muted'
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[13px] font-medium text-[var(--color-text-muted)]">{children}</p>
  )
}
