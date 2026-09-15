import { Link } from 'react-router-dom'
import { PageHeader } from '@/presentation/components/ui/PageHeader'

export function FinanceHubPage() {
  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Contas a pagar e a receber da operação."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/financeiro/pagar"
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-primary)]"
        >
          <h2 className="text-lg font-semibold">Contas a pagar</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Cadastro, vencimento, status e consulta.
          </p>
        </Link>
        <Link
          to="/financeiro/receber"
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-primary)]"
        >
          <h2 className="text-lg font-semibold">Contas a receber</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Cadastro, vencimento, status e consulta.
          </p>
        </Link>
      </div>
    </div>
  )
}
