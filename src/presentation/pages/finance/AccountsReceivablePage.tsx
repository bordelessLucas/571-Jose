import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AccountReceivable, FinancialStatus } from '@/domain/types'
import { FINANCIAL_STATUS_LABELS } from '@/domain/types'
import { formatCurrency, formatDate } from '@/lib/format'
import { isOverdue } from '@/lib/finance'
import { useAccountsReceivable } from '@/hooks/useAccountsReceivable'
import { useUrlSyncedState } from '@/hooks/useUrlSyncedState'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { ConfirmDialog } from '@/presentation/components/ui/ConfirmDialog'
import { DataTable } from '@/presentation/components/ui/DataTable'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Select } from '@/presentation/components/ui/Select'
import { Spinner } from '@/presentation/components/ui/Spinner'
import {
  StatusBadge,
  financialStatusTone,
} from '@/presentation/components/ui/StatusBadge'

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'pago', label: 'Pago' },
  { value: 'cancelado', label: 'Cancelado' },
]

export function AccountsReceivablePage() {
  const [statusFilter, setStatusFilter] =
    useUrlSyncedState<FinancialStatus | 'all'>('status', 'all')
  const { accounts, loading, error, remove, pay } = useAccountsReceivable(statusFilter)
  const [pendingDelete, setPendingDelete] = useState<AccountReceivable | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const rows = useMemo(() => accounts, [accounts])

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    setActionError(null)
    try {
      await remove(pendingDelete.id)
      setPendingDelete(null)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Nao foi possivel excluir a conta.')
    } finally {
      setDeleting(false)
    }
  }

  async function handlePay(row: AccountReceivable) {
    setActionError(null)
    const discountRaw = window.prompt('Desconto concedido (R$)', '0')
    if (discountRaw === null) return
    const discountAmount = Number.parseFloat(discountRaw.replace(',', '.')) || 0
    if (discountAmount < 0) {
      setActionError('O desconto nao pode ser negativo.')
      return
    }
    if (discountAmount > row.originalAmount) {
      setActionError('O desconto nao pode ser maior que o valor original.')
      return
    }
    const finalAmount = Math.max(row.originalAmount - discountAmount, 0)
    const paidRaw = window.prompt('Valor recebido (R$)', String(finalAmount))
    if (paidRaw === null) return
    const paidAmount = Number.parseFloat(paidRaw.replace(',', '.')) || 0
    if (paidAmount < 0) {
      setActionError('O valor recebido nao pode ser negativo.')
      return
    }
    const discountReason =
      discountAmount > 0
        ? window.prompt('Motivo do desconto') ?? ''
        : ''

    setPayingId(row.id)
    try {
      await pay(row.id, {
        discountAmount,
        paidAmount,
        discountReason,
      })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Nao foi possivel baixar a conta.')
    } finally {
      setPayingId(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Contas a receber"
        description="Débitos de clientes, inclusive gerados automaticamente pelas vendas."
        backTo="/financeiro"
        actions={
          <Link to="/financeiro/receber/novo">
            <Button>Nova conta</Button>
          </Link>
        }
      />

      <div className="mb-4 max-w-xs">
        <Select
          label="Filtrar por status"
          name="statusFilter"
          value={statusFilter}
          options={STATUS_FILTER_OPTIONS}
          onChange={(event) =>
            setStatusFilter(event.target.value as FinancialStatus | 'all')
          }
        />
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {actionError ? <Alert tone="danger">{actionError}</Alert> : null}
      {loading ? <Spinner /> : null}

      {!loading ? (
        <DataTable
          rows={rows}
          rowKey={(row) => row.id}
          emptyTitle="Nenhuma conta a receber"
          emptyDescription="Cadastre recebíveis ou feche vendas para gerar débitos automaticamente."
          emptyAction={
            <Link to="/financeiro/receber/novo">
              <Button>Nova conta</Button>
            </Link>
          }
          columns={[
            {
              key: 'dueDate',
              header: 'Vencimento',
              render: (row) => {
                const overdue = isOverdue(row.dueDate, row.status)
                return (
                  <span className={overdue ? 'font-medium text-[var(--color-danger)]' : ''}>
                    {formatDate(row.dueDate)}
                  </span>
                )
              },
            },
            {
              key: 'description',
              header: 'Descrição',
              render: (row) => row.description,
            },
            {
              key: 'client',
              header: 'Cliente',
              render: (row) => row.clientName || '—',
            },
            {
              key: 'amount',
              header: 'Valor',
              align: 'right',
              render: (row) => formatCurrency(row.amount),
            },
            {
              key: 'balance',
              header: 'Saldo',
              align: 'right',
              render: (row) => formatCurrency(row.balance),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => {
                const overdue = isOverdue(row.dueDate, row.status)
                return (
                  <StatusBadge
                    label={
                      overdue
                        ? 'Pendente (vencida)'
                        : FINANCIAL_STATUS_LABELS[row.status]
                    }
                    tone={financialStatusTone(row.status, overdue)}
                  />
                )
              },
            },
            {
              key: 'actions',
              header: 'Ações',
              align: 'right',
              render: (row) => (
                <div className="flex flex-wrap justify-end gap-2">
                  <Link to={`/financeiro/receber/${row.id}`}>
                    <Button variant="ghost">Editar</Button>
                  </Link>
                  {row.status === 'pendente' ? (
                    <Button
                      variant="secondary"
                      disabled={payingId === row.id}
                      onClick={() => {
                        void handlePay(row)
                      }}
                    >
                      {payingId === row.id ? 'Baixando...' : 'Baixar'}
                    </Button>
                  ) : null}
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
        title="Excluir conta a receber?"
        description={
          pendingDelete
            ? `A conta "${pendingDelete.description}" será removida.`
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
