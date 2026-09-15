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
}

export function Select({
  label,
  options,
  placeholder,
  error,
  id,
  className = '',
  ...props
}: SelectProps) {
  const selectId = id ?? props.name

  return (
    <label className="flex flex-col gap-1.5 text-left" htmlFor={selectId}>
      <span className="text-[13px] font-medium text-[var(--color-text-muted)]">
        {label}
      </span>
      <select
        id={selectId}
        className={`rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[15px] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] ${className}`}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-[13px] text-[var(--color-danger)]">{error}</span> : null}
    </label>
  )
}
