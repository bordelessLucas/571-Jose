import { ArrowLeft, House } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { useSmartBack } from '@/hooks/useSmartBack'
import { Button } from '@/presentation/components/ui/Button'

type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
  backTo?: string
  showDashboard?: boolean
  meta?: ReactNode
}

export function PageHeader({
  title,
  description,
  actions,
  backTo,
  showDashboard,
  meta,
}: PageHeaderProps) {
  const fallback = backTo ?? '/'
  const { goBack, goDashboard } = useSmartBack(fallback)
  const shouldShowDashboard = showDashboard ?? Boolean(backTo)

  return (
    <header className="mb-5 flex flex-col gap-3">
      {(backTo || shouldShowDashboard) && (
        <div className="flex flex-wrap items-center gap-2">
          {backTo ? (
            <Button type="button" variant="ghost" onClick={goBack}>
              <ArrowLeft size={16} weight="duotone" aria-hidden />
              Voltar
            </Button>
          ) : null}
          {shouldShowDashboard ? (
            <Button type="button" variant="secondary" onClick={goDashboard}>
              <House size={16} weight="duotone" aria-hidden />
              Painel
            </Button>
          ) : null}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold leading-tight text-[var(--color-text)] text-balance">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
              {description}
            </p>
          ) : null}
          {meta ? <div className="mt-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
