import { PageHeader } from '@/presentation/components/ui/PageHeader'

type ModulePlaceholderPageProps = {
  title: string
  description: string
}

export function ModulePlaceholderPage({
  title,
  description,
}: ModulePlaceholderPageProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
        Módulo previsto para as próximas sprints. Navegação já disponível no menu.
      </div>
    </div>
  )
}
