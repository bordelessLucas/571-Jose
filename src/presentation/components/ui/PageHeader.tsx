import type { ReactNode } from 'react'
import { Button } from '@/presentation/components/ui/Button'
import { useSmartBack } from '@/hooks/useSmartBack'

type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
  /** Rota fallback quando não há histórico (ex.: /clientes). */
  backTo?: string
  /** Exibe botão para o painel. Default: true quando backTo existe. */
  showDashboard?: boolean
}

export function PageHeader({
  title,
  description,
  actions,
  backTo,
  showDashboard,
}: PageHeaderProps) {
  const fallback = backTo ?? '/'
  const { goBack, goDashboard } = useSmartBack(fallback)
  const shouldShowDashboard = showDashboard ?? Boolean(backTo)

  return (
    <header className="mb-6 flex flex-col gap-3">
      {(backTo || shouldShowDashboard) && (
        <div className="flex flex-wrap items-center gap-2">
          {backTo ? (
            <Button type="button" variant="ghost" onClick={goBack}>
              ← Voltar
            </Button>
          ) : null}
          {shouldShowDashboard ? (
            <Button type="button" variant="secondary" onClick={goDashboard}>
              Painel
            </Button>
          ) : null}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
