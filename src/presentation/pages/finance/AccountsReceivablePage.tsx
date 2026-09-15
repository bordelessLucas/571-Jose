import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AccountReceivable, FinancialStatus } from '@/domain/types'
import { FINANCIAL_STATUS_LABELS } from '@/domain/types'
import { formatCurrency, formatDate } from '@/lib/format'
import { isOverdue } from '@/lib/finance'
import { useAccountsReceivable } from '@/hooks/useAccountsReceivable'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
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

export function AccountsReceivablePage() {
  const [statusFilter, setStatusFilter] = useState<FinancialStatus | 'all'>('all')
  const { accounts, loading, error, remove } = useAccountsReceivable(statusFilter)
  const rows = useMemo(() => accounts, [accounts])

  async function handleDelete(account: AccountReceivable) {
    const confirmed = window.confirm('Excluir esta conta a receber?')
    if (!confirmed) return
    await remove(account.id)
  }

  return (
    <div>
      <PageHeader
        title="Contas a receber"
        description="Lançamentos com valor, vencimento e status."
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
      {loading ? <Spinner /> : null}

      {!loading ? (
        <DataTable
          rows={rows}
          rowKey={(row) => row.id}
          emptyMessage="Nenhuma conta a receber cadastrada."
          columns={[
            {
              key: 'dueDate',
              header: 'Vencimento',
              render: (row) => formatDate(row.dueDate),
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
              render: (row) =>
                isOverdue(row.dueDate, row.status)
                  ? 'Pendente (vencida)'
                  : FINANCIAL_STATUS_LABELS[row.status],
            },
            {
              key: 'actions',
              header: 'Ações',
              align: 'right',
              render: (row) => (
                <div className="flex justify-end gap-2">
                  <Link to={`/financeiro/receber/${row.id}`}>
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
