import { Link } from 'react-router-dom'
import type { Sale } from '@/domain/types'
import { formatCurrency, formatDate } from '@/lib/format'
import { useSales } from '@/hooks/useSales'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { DataTable } from '@/presentation/components/ui/DataTable'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Spinner } from '@/presentation/components/ui/Spinner'

export function SalesPage() {
  const { sales, loading, error, remove } = useSales()

  async function handleDelete(sale: Sale) {
    const confirmed = window.confirm('Excluir este registro de venda?')
    if (!confirmed) return
    await remove(sale.id)
  }

  return (
    <div>
      <PageHeader
        title="Vendas"
        description="Histórico comercial com cliente, vendedor e valor."
        actions={
          <Link to="/vendas/nova">
            <Button>Nova venda</Button>
          </Link>
        }
      />

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {loading ? <Spinner /> : null}

      {!loading ? (
        <DataTable
          rows={sales}
          rowKey={(row) => row.id}
          emptyMessage="Nenhuma venda registrada."
          columns={[
            {
              key: 'soldAt',
              header: 'Data',
              render: (row) => formatDate(row.soldAt),
            },
            { key: 'client', header: 'Cliente', render: (row) => row.clientName },
            { key: 'seller', header: 'Vendedor', render: (row) => row.sellerName },
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
                  <Link to={`/vendas/${row.id}`}>
                    <Button variant="ghost">Detalhes</Button>
                  </Link>
                  <Link to={`/vendas/${row.id}/editar`}>
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
