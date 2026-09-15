import { Link } from 'react-router-dom'
import type { Expense } from '@/domain/types'
import { EXPENSE_CATEGORY_LABELS } from '@/domain/types'
import { formatCurrency, formatDate } from '@/lib/format'
import { useExpenses } from '@/hooks/useExpenses'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { DataTable } from '@/presentation/components/ui/DataTable'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Spinner } from '@/presentation/components/ui/Spinner'

export function ExpensesPage() {
  const { expenses, loading, error, remove } = useExpenses()

  async function handleDelete(expense: Expense) {
    const confirmed = window.confirm('Excluir esta despesa?')
    if (!confirmed) return
    await remove(expense.id)
  }

  return (
    <div>
      <PageHeader
        title="Despesas"
        description="Lançamentos com descrição, categoria, valor e data."
        actions={
          <Link to="/despesas/nova">
            <Button>Nova despesa</Button>
          </Link>
        }
      />

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {loading ? <Spinner /> : null}

      {!loading ? (
        <DataTable
          rows={expenses}
          rowKey={(row) => row.id}
          emptyMessage="Nenhuma despesa registrada."
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
                <div className="flex justify-end gap-2">
                  <Link to={`/despesas/${row.id}`}>
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
