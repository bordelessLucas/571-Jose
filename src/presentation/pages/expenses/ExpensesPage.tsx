import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Expense } from '@/domain/types'
import { EXPENSE_CATEGORY_LABELS } from '@/domain/types'
import { formatCurrency, formatDate } from '@/lib/format'
import { useExpenses } from '@/hooks/useExpenses'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { ConfirmDialog } from '@/presentation/components/ui/ConfirmDialog'
import { DataTable } from '@/presentation/components/ui/DataTable'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Spinner } from '@/presentation/components/ui/Spinner'

export function ExpensesPage() {
  const { expenses, loading, error, remove } = useExpenses()
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null)
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

  return (
    <div>
      <PageHeader
        title="Despesas"
        description="Lançamentos com descrição, categoria, valor e data."
        showDashboard
        actions={
          <Link to="/despesas/nova">
            <Button>Nova despesa</Button>
          </Link>
        }
        meta={
          !loading ? (
            <p className="text-[13px] text-[var(--color-text-muted)]">
              {expenses.length} lançamentos
            </p>
          ) : null
        }
      />

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {loading ? <Spinner /> : null}

      {!loading ? (
        <DataTable
          rows={expenses}
          rowKey={(row) => row.id}
          emptyTitle="Nenhuma despesa registrada"
          emptyDescription="Lance despesas operacionais para alimentar a DRE."
          emptyAction={
            <Link to="/despesas/nova">
              <Button>Nova despesa</Button>
            </Link>
          }
          columns={[
            {
              key: 'date',
              header: 'Data',
              render: (row) => formatDate(row.expenseDate),
            },
            {
              key: 'description',
              header: 'Descrição',
              render: (row) => row.description,
            },
            {
              key: 'category',
              header: 'Categoria',
              render: (row) => EXPENSE_CATEGORY_LABELS[row.category],
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
                  <Link to={`/despesas/${row.id}`}>
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
        title="Excluir despesa?"
        description={
          pendingDelete
            ? `A despesa "${pendingDelete.description}" (${formatCurrency(pendingDelete.amount)}) será removida.`
            : ''
        }
        confirmLabel="Excluir despesa"
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
