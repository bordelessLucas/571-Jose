import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AccountPayable, FinancialStatus } from '@/domain/types'
import { FINANCIAL_STATUS_LABELS } from '@/domain/types'
import { formatCurrency, formatDate } from '@/lib/format'
import { isOverdue } from '@/lib/finance'
import { useAccountsPayable } from '@/hooks/useAccountsPayable'
import { useUrlSyncedState } from '@/hooks/useUrlSyncedState'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { ConfirmDialog } from '@/presentation/components/ui/ConfirmDialog'
import { DataTable } from '@/presentation/components/ui/DataTable'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Select } from '@/presentation/components/ui/Select'
import { Spinner } from '@/presentation/components/ui/Spinner'

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'pago', label: 'Pago' },
  { value: 'cancelado', label: 'Cancelado' },
]

export function AccountsPayablePage() {
  const [statusFilter, setStatusFilter] =
    useUrlSyncedState<FinancialStatus | 'all'>('status', 'all')
  const { accounts, loading, error, remove, updateStatus } =
    useAccountsPayable(statusFilter)
  const [pendingDelete, setPendingDelete] = useState<AccountPayable | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)
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

  async function handleStatusChange(row: AccountPayable, status: FinancialStatus) {
    if (row.status === status) return
    setUpdatingStatusId(row.id)
    setActionError(null)
    try {
      await updateStatus(row.id, status)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Nao foi possivel atualizar o status.')
    } finally {
      setUpdatingStatusId(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Contas a pagar"
        description="Lançamentos com valor, vencimento e status."
        backTo="/financeiro"
        actions={
          <Link to="/financeiro/pagar/novo">
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
          emptyTitle="Nenhuma conta a pagar"
          emptyDescription="Cadastre obrigações com vencimento e acompanhe o status."
          emptyAction={
            <Link to="/financeiro/pagar/novo">
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
              key: 'amount',
              header: 'Valor',
              align: 'right',
              render: (row) => formatCurrency(row.amount),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => {
                const overdue = isOverdue(row.dueDate, row.status)
                return (
                  <select
                    aria-label={`Status de ${row.description}`}
                    name={`status-${row.id}`}
                    value={row.status}
                    disabled={updatingStatusId === row.id}
                    title={
                      overdue ? 'Conta pendente vencida' : FINANCIAL_STATUS_LABELS[row.status]
                    }
                    className={`min-w-36 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-[14px] outline-none focus-visible:border-[var(--color-primary)] focus-visible:shadow-[var(--focus-ring)] disabled:opacity-60 ${
                      overdue ? 'border-[var(--color-danger)] text-[var(--color-danger)]' : ''
                    }`}
                    onChange={(event) => {
                      void handleStatusChange(
                        row,
                        event.target.value as FinancialStatus,
                      )
                    }}
                  >
                    {STATUS_FILTER_OPTIONS.filter((option) => option.value !== 'all').map(
                      (option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                )
              },
            },
            {
              key: 'actions',
              header: 'Ações',
              align: 'right',
              render: (row) => (
                <div className="flex flex-wrap justify-end gap-2">
                  <Link to={`/financeiro/pagar/${row.id}`}>
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
        title="Excluir conta a pagar?"
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
