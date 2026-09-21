import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { CashMovement } from '@/domain/types'
import { CASH_MOVEMENT_TYPE_LABELS } from '@/domain/types'
import { formatCurrency, formatDate } from '@/lib/format'
import { calculateSalePaymentTotals } from '@/lib/salePaymentTotals'
import { useCash } from '@/hooks/useCash'
import { useSales } from '@/hooks/useSales'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { ConfirmDialog } from '@/presentation/components/ui/ConfirmDialog'
import { DataTable } from '@/presentation/components/ui/DataTable'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Spinner } from '@/presentation/components/ui/Spinner'
import { StatusBadge } from '@/presentation/components/ui/StatusBadge'

export function CashPage() {
  const { movements, balance, loading, error, remove } = useCash()
  const { sales } = useSales()
  const [pendingDelete, setPendingDelete] = useState<CashMovement | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await remove(pendingDelete.id)
      setPendingDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const todaySales = sales.filter((sale) => sale.soldAt === today)
  const paymentTotals = calculateSalePaymentTotals(todaySales)
  const cashTotal = paymentTotals.dinheiro
  const pixTotal = paymentTotals.pix
  const creditTotal = paymentTotals.fiado
  const deliveredCount = todaySales.filter(
    (sale) => sale.deliveryStatus === 'delivered',
  ).length

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
            <p className="mt-1 font-mono text-lg tabular-nums text-[var(--color-success)]">
              {formatCurrency(balance.entradas)}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-[13px] text-[var(--color-text-muted)]">Saídas</p>
            <p className="mt-1 font-mono text-lg tabular-nums text-[var(--color-danger)]">
              {formatCurrency(balance.saidas)}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-[13px] text-[var(--color-text-muted)]">Saldo</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-[var(--color-primary)]">
              {formatCurrency(balance.saldo)}
            </p>
          </div>
        </div>
      ) : null}

      <section className="mb-6 surface-panel rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          Fechamento operacional de hoje
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <div>
            <p className="text-[13px] text-[var(--color-text-muted)]">Dinheiro</p>
            <p className="font-mono font-semibold">{formatCurrency(cashTotal)}</p>
          </div>
          <div>
            <p className="text-[13px] text-[var(--color-text-muted)]">PIX</p>
            <p className="font-mono font-semibold">{formatCurrency(pixTotal)}</p>
          </div>
          <div>
            <p className="text-[13px] text-[var(--color-text-muted)]">Fiado</p>
            <p className="font-mono font-semibold">{formatCurrency(creditTotal)}</p>
          </div>
          <div>
            <p className="text-[13px] text-[var(--color-text-muted)]">Entregas</p>
            <p className="font-mono font-semibold">{deliveredCount}</p>
          </div>
        </div>
      </section>

      {loading ? <Spinner /> : null}

      {!loading ? (
        <DataTable
          rows={movements}
          rowKey={(row) => row.id}
          emptyTitle="Nenhuma movimentação registrada"
          emptyDescription="Registre entradas e saídas para acompanhar o saldo do caixa."
          emptyAction={
            <Link to="/caixa/nova">
              <Button>Nova movimentação</Button>
            </Link>
          }
          columns={[
            {
              key: 'date',
              header: 'Data',
              render: (row) => formatDate(row.movementDate),
            },
            {
              key: 'type',
              header: 'Tipo',
              render: (row) => (
                <StatusBadge
                  label={CASH_MOVEMENT_TYPE_LABELS[row.type]}
                  tone={row.type === 'entrada' ? 'success' : 'danger'}
                />
              ),
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
                  <Button variant="danger" onClick={() => setPendingDelete(row)}>
                    Excluir
                  </Button>
                </div>
              ),
            },
          ]}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Excluir movimentação?"
        description={
          pendingDelete
            ? `A ${CASH_MOVEMENT_TYPE_LABELS[pendingDelete.type].toLowerCase()} de ${formatCurrency(pendingDelete.amount)} será removida.`
            : ''
        }
        confirmLabel="Excluir"
        busy={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(null)
        }}
        onConfirm={() => {
          void confirmDelete()
        }}
      />
    </div>
  )
}
