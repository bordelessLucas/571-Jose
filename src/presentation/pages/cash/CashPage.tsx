import { Link } from 'react-router-dom'
import type { CashMovement } from '@/domain/types'
import { CASH_MOVEMENT_TYPE_LABELS } from '@/domain/types'
import { formatCurrency, formatDate } from '@/lib/format'
import { useCash } from '@/hooks/useCash'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { DataTable } from '@/presentation/components/ui/DataTable'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Spinner } from '@/presentation/components/ui/Spinner'

export function CashPage() {
  const { movements, balance, loading, error, remove } = useCash()

  async function handleDelete(movement: CashMovement) {
    const confirmed = window.confirm('Excluir esta movimentação?')
    if (!confirmed) return
    await remove(movement.id)
  }

  return (
    <div>
      <PageHeader
        title="Caixa"
        description="Entradas, saídas e saldo movimentado."
        showDashboard
        actions={
          <Link to="/caixa/nova">
            <Button>Nova movimentação</Button>
          </Link>
        }
      />

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {balance ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-[13px] text-[var(--color-text-muted)]">Entradas</p>
            <p className="mt-1 font-mono text-lg text-[var(--color-success)]">
              {formatCurrency(balance.entradas)}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-[13px] text-[var(--color-text-muted)]">Saídas</p>
            <p className="mt-1 font-mono text-lg text-[var(--color-danger)]">
              {formatCurrency(balance.saidas)}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-[13px] text-[var(--color-text-muted)]">Saldo</p>
            <p className="mt-1 font-mono text-lg font-semibold text-[var(--color-primary)]">
              {formatCurrency(balance.saldo)}
            </p>
          </div>
        </div>
      ) : null}

      {loading ? <Spinner /> : null}

      {!loading ? (
        <DataTable
          rows={movements}
          rowKey={(row) => row.id}
          emptyMessage="Nenhuma movimentação registrada."
          columns={[
            {
              key: 'date',
              header: 'Data',
              render: (row) => formatDate(row.movementDate),
            },
            {
              key: 'type',
              header: 'Tipo',
              render: (row) => CASH_MOVEMENT_TYPE_LABELS[row.type],
            },
            {
              key: 'description',
              header: 'Descrição',
              render: (row) => row.description,
            },
            {
              key: 'amount',
              header: 'Valor',
              align: 'right',
              render: (row) => formatCurrency(row.amount),
            },
            {
              key: 'actions',
              header: 'Ações',
              align: 'right',
              render: (row) => (
                <div className="flex flex-wrap justify-end gap-2">
                  <Link to={`/caixa/${row.id}`}>
                    <Button variant="ghost">Editar</Button>
                  </Link>
                  <Button
                    variant="danger"
                    onClick={() => {
                      void handleDelete(row)
                    }}
                  >
                    Excluir
                  </Button>
                </div>
              ),
            },
          ]}
        />
      ) : null}
    </div>
  )
}
