import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  const inputId = id ?? props.name

  return (
    <label className="flex flex-col gap-1.5 text-left" htmlFor={inputId}>
      <span className="text-[13px] font-medium text-[var(--color-text-muted)]">
        {label}
      </span>
      <input
        id={inputId}
        className={`rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[15px] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] ${className}`}
        {...props}
      />
      {error ? <span className="text-[13px] text-[var(--color-danger)]">{error}</span> : null}
    </label>
  )
}
