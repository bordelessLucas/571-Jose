import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { CashClosing, CashMovement } from '@/domain/types'
import { CASH_MOVEMENT_TYPE_LABELS } from '@/domain/types'
import { AppError } from '@/lib/errors'
import { formatCurrency, formatDate, todayInputValue } from '@/lib/format'
import { calculateSalePaymentTotals } from '@/lib/salePaymentTotals'
import { useCash } from '@/hooks/useCash'
import { useSales } from '@/hooks/useSales'
import {
  closeCashDay,
  getCashClosingByDate,
  reopenCashDay,
} from '@/services/cash.service'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { ConfirmDialog } from '@/presentation/components/ui/ConfirmDialog'
import { DataTable } from '@/presentation/components/ui/DataTable'
import { Input } from '@/presentation/components/ui/Input'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Spinner } from '@/presentation/components/ui/Spinner'
import { StatusBadge } from '@/presentation/components/ui/StatusBadge'
import { TextArea } from '@/presentation/components/ui/TextArea'

export function CashPage() {
  const { movements, balance, loading, error, remove } = useCash()
  const { sales } = useSales()
  const [pendingDelete, setPendingDelete] = useState<CashMovement | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [closingDate, setClosingDate] = useState(todayInputValue())
  const [closing, setClosing] = useState<CashClosing | null>(null)
  const [closingLoading, setClosingLoading] = useState(false)
  const [closingBusy, setClosingBusy] = useState(false)
  const [closingError, setClosingError] = useState<string | null>(null)
  const [actualCashAmount, setActualCashAmount] = useState(0)
  const [closingNotes, setClosingNotes] = useState('')
  const [showClosingPanel, setShowClosingPanel] = useState(false)

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    setClosingError(null)
    try {
      await remove(pendingDelete.id)
      setPendingDelete(null)
    } catch (err) {
      setClosingError(
        err instanceof AppError ? err.message : 'Falha ao excluir movimentacao.',
      )
    } finally {
      setDeleting(false)
    }
  }

  const daySales = useMemo(
    () => sales.filter((sale) => sale.soldAt === closingDate),
    [sales, closingDate],
  )
  const paymentTotals = calculateSalePaymentTotals(daySales)
  const cashTotal = paymentTotals.dinheiro
  const pixTotal = paymentTotals.pix
  const creditTotal = paymentTotals.fiado
  const salesTotal = daySales.reduce((sum, sale) => sum + sale.amount, 0)
  const deliveredCount = daySales.filter(
    (sale) => sale.deliveryStatus === 'delivered',
  ).length
  const differenceAmount = actualCashAmount - cashTotal

  useEffect(() => {
    let active = true
    setClosingLoading(true)
    setClosingError(null)

    void getCashClosingByDate(closingDate)
      .then((data) => {
        if (!active) return
        setClosing(data)
        setActualCashAmount(data?.actualCashAmount ?? cashTotal)
        setClosingNotes(data?.notes ?? '')
      })
      .catch((err: unknown) => {
        if (!active) return
        setClosing(null)
        setClosingError(
          err instanceof AppError
            ? err.message
            : 'Nao foi possivel carregar o fechamento.',
        )
      })
      .finally(() => {
        if (active) setClosingLoading(false)
      })

    return () => {
      active = false
    }
  }, [closingDate, cashTotal])

  async function handleCloseCash() {
    if (actualCashAmount < 0) {
      setClosingError('O dinheiro contado nao pode ser negativo.')
      return
    }
    setClosingBusy(true)
    setClosingError(null)
    try {
      await closeCashDay({
        closingDate,
        expectedCashAmount: cashTotal,
        actualCashAmount,
        salesTotal,
        pixTotal,
        creditTotal,
        deliveriesCount: deliveredCount,
        notes: closingNotes,
      })
      setClosing(await getCashClosingByDate(closingDate))
      setShowClosingPanel(false)
    } catch (err) {
      setClosingError(err instanceof AppError ? err.message : 'Falha ao fechar caixa.')
    } finally {
      setClosingBusy(false)
    }
  }

  async function handleReopenCash() {
    setClosingBusy(true)
    setClosingError(null)
    try {
      await reopenCashDay(closingDate)
      setClosing(await getCashClosingByDate(closingDate))
    } catch (err) {
      setClosingError(err instanceof AppError ? err.message : 'Falha ao reabrir caixa.')
    } finally {
      setClosingBusy(false)
    }
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
      {closingError ? <Alert tone="danger">{closingError}</Alert> : null}

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
          Fechamento operacional
        </h2>
        <div className="mt-3 max-w-xs">
          <Input
            label="Data do fechamento"
            name="closingDate"
            type="date"
            value={closingDate}
            onChange={(event) => {
              setClosingDate(event.target.value)
              setShowClosingPanel(false)
            }}
          />
        </div>
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <StatusBadge
            label={
              closing?.status === 'closed'
                ? 'Caixa fechado'
                : closing?.status === 'reopened'
                  ? 'Reaberto'
                  : 'Aberto'
            }
            tone={closing?.status === 'closed' ? 'success' : 'warning'}
          />
          <Button
            variant={closing?.status === 'closed' ? 'secondary' : 'primary'}
            disabled={closingLoading}
            onClick={() => setShowClosingPanel((value) => !value)}
          >
            {showClosingPanel
              ? 'Ocultar fechamento'
              : closing?.status === 'closed'
                ? 'Ver fechamento'
                : 'Fechar caixa do dia'}
          </Button>
        </div>

        {showClosingPanel ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
            <Input
              label="Dinheiro contado (R$)"
              name="actualCashAmount"
              type="number"
              min="0"
              step="0.01"
              value={actualCashAmount || ''}
              disabled={closing?.status === 'closed'}
              onChange={(event) =>
                setActualCashAmount(Number.parseFloat(event.target.value) || 0)
              }
            />
            <TextArea
              label="Observacao do fechamento"
              name="closingNotes"
              value={closingNotes}
              disabled={closing?.status === 'closed'}
              onChange={(event) => setClosingNotes(event.target.value)}
            />
            <div className="flex flex-col justify-end gap-2">
              <p className="text-sm text-[var(--color-text-muted)]">
                Diferenca:{' '}
                <span className="font-mono font-semibold text-[var(--color-text)]">
                  {formatCurrency(differenceAmount)}
                </span>
              </p>
              {closing?.status === 'closed' ? (
              <Button
                variant="secondary"
                disabled={closingBusy || closingLoading}
                onClick={() => {
                  void handleReopenCash()
                }}
              >
                Reabrir caixa
              </Button>
              ) : (
              <Button
                disabled={closingBusy || closingLoading}
                onClick={() => {
                  void handleCloseCash()
                }}
              >
                Fechar caixa
              </Button>
              )}
            </div>
          </div>
        ) : null}
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
