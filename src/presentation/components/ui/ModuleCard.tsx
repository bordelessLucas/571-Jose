import { Link } from 'react-router-dom'

type ModuleCardProps = {
  to: string
  title: string
  description: string
}

export function ModuleCard({ to, title, description }: ModuleCardProps) {
  return (
    <Link
      to={to}
      className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-[border-color,box-shadow] duration-150 hover:border-[var(--color-primary)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
    >
      <h2 className="text-lg font-semibold text-[var(--color-text)] text-pretty">
        {title}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>
    </Link>
  )
}
