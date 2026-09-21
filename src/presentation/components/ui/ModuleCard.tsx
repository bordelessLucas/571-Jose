import { Link } from 'react-router-dom'
import type { Icon } from '@phosphor-icons/react'

type ModuleCardProps = {
  to: string
  title: string
  description: string
  icon?: Icon
}

export function ModuleCard({ to, title, description, icon: Icon }: ModuleCardProps) {
  return (
    <Link
      to={to}
      className="surface-panel group flex min-h-32 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4 transition-[border-color,box-shadow] duration-150 ease-[var(--motion-ease)] hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
    >
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)] text-pretty">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
            {description}
          </p>
        </div>
        <span className="text-sm font-medium text-[var(--color-primary)]">
          Abrir modulo
        </span>
      </div>
      {Icon ? (
        <div className="ml-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] text-[var(--color-primary)]">
          <Icon size={22} weight="duotone" aria-hidden />
        </div>
      ) : null}
    </Link>
  )
}
