import type { TextareaHTMLAttributes } from 'react'

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  error?: string
}

export function TextArea({
  label,
  error,
  id,
  className = '',
  ...props
}: TextAreaProps) {
  const areaId = id ?? props.name

  return (
    <label className="flex flex-col gap-1.5 text-left" htmlFor={areaId}>
      <span className="text-[13px] font-medium text-[var(--color-text-muted)]">
        {label}
      </span>
      <textarea
        id={areaId}
        className={`min-h-24 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[15px] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] ${className}`}
        {...props}
      />
      {error ? <span className="text-[13px] text-[var(--color-danger)]">{error}</span> : null}
    </label>
  )
}
