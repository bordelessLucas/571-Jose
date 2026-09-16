import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  hint?: string
}

export function Input({
  label,
  error,
  hint,
  id,
  className = '',
  ...props
}: InputProps) {
  const inputId = id ?? props.name
  const errorId = error && inputId ? `${inputId}-error` : undefined
  const hintId = hint && inputId ? `${inputId}-hint` : undefined

  return (
    <label className="flex flex-col gap-1.5 text-left" htmlFor={inputId}>
      <span className="text-[13px] font-medium text-[var(--color-text-muted)]">
        {label}
      </span>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        className={`rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[15px] text-[var(--color-text)] outline-none transition-[border-color,box-shadow] duration-150 focus-visible:border-[var(--color-primary)] focus-visible:shadow-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60 ${error ? 'border-[var(--color-danger)]' : ''} ${className}`}
        {...props}
      />
      {hint && !error ? (
        <span id={hintId} className="text-[12px] text-[var(--color-text-muted)]">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="text-[13px] text-[var(--color-danger)]">
          {error}
        </span>
      ) : null}
    </label>
  )
}
