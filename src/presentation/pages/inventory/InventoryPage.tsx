import { Link } from 'react-router-dom'
import type { InventoryItem } from '@/domain/types'
import { useInventory } from '@/hooks/useInventory'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { DataTable } from '@/presentation/components/ui/DataTable'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Spinner } from '@/presentation/components/ui/Spinner'

export function InventoryPage() {
  const { items, loading, error, remove } = useInventory()

  async function handleDelete(item: InventoryItem) {
    const confirmed = window.confirm(`Excluir o item "${item.name}"?`)
    if (!confirmed) return
    await remove(item.id)
  }

  return (
    <div>
      <PageHeader
        title="Estoque"
        description="Cadastro de itens e quantidade disponível."
        actions={
          <Link to="/estoque/novo">
            <Button>Novo item</Button>
          </Link>
        }
      />

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {loading ? <Spinner /> : null}

      {!loading ? (
        <DataTable
          rows={items}
          rowKey={(row) => row.id}
          emptyMessage="Nenhum item cadastrado."
          columns={[
            { key: 'name', header: 'Item', render: (row) => row.name },
            { key: 'sku', header: 'SKU', render: (row) => row.sku || '—' },
            {
              key: 'quantity',
              header: 'Qtd.',
              align: 'right',
              render: (row) => `${row.quantity} ${row.unit}`,
            },
            {
              key: 'actions',
              header: 'Ações',
              align: 'right',
              render: (row) => (
                <div className="flex justify-end gap-2">
                  <Link to={`/estoque/${row.id}`}>
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
