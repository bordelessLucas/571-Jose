import type { SelectHTMLAttributes } from 'react'

type Option = {
  value: string
  label: string
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  options: Option[]
  placeholder?: string
  error?: string
  hint?: string
}

export function Select({
  label,
  options,
  placeholder,
  error,
  hint,
  id,
  className = '',
  ...props
}: SelectProps) {
  const selectId = id ?? props.name
  const errorId = error && selectId ? `${selectId}-error` : undefined
  const hintId = hint && selectId ? `${selectId}-hint` : undefined

  return (
    <label className="flex flex-col gap-1.5 text-left" htmlFor={selectId}>
      <span className="text-[13px] font-medium text-[var(--color-text-muted)]">
        {label}
      </span>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        className={`rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[15px] text-[var(--color-text)] outline-none transition-[border-color,box-shadow] duration-150 focus-visible:border-[var(--color-primary)] focus-visible:shadow-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60 ${error ? 'border-[var(--color-danger)]' : ''} ${className}`}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
