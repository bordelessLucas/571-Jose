import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { InventoryItem } from '@/domain/types'
import { useInventory } from '@/hooks/useInventory'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { ConfirmDialog } from '@/presentation/components/ui/ConfirmDialog'
import { DataTable } from '@/presentation/components/ui/DataTable'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Spinner } from '@/presentation/components/ui/Spinner'
import { StatusBadge } from '@/presentation/components/ui/StatusBadge'

export function InventoryPage() {
  const { items, loading, error, remove } = useInventory()
  const [pendingDelete, setPendingDelete] = useState<InventoryItem | null>(null)
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
        title="Estoque"
        description="Cadastro de itens e quantidade disponível para vendas."
        showDashboard
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
          emptyTitle="Nenhum item cadastrado"
          emptyDescription="Cadastre produtos para selecioná-los nas vendas e controlar o saldo."
          emptyAction={
            <Link to="/estoque/novo">
              <Button>Novo item</Button>
            </Link>
          }
          columns={[
            { key: 'name', header: 'Item', render: (row) => row.name },
            { key: 'sku', header: 'SKU', render: (row) => row.sku || '—' },
            {
              key: 'quantity',
              header: 'Qtd.',
              align: 'right',
              render: (row) => (
                <span className="inline-flex items-center gap-2">
                  <span className="tabular-nums">
                    {row.quantity} {row.unit}
                  </span>
                  {row.quantity <= 0 ? (
                    <StatusBadge label="Zerado" tone="danger" />
                  ) : row.quantity < 10 ? (
                    <StatusBadge label="Baixo" tone="warning" />
                  ) : null}
                </span>
              ),
            },
            {
              key: 'actions',
              header: 'Ações',
              align: 'right',
              render: (row) => (
                <div className="flex flex-wrap justify-end gap-2">
                  <Link to={`/estoque/${row.id}`}>
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
        title="Excluir item?"
        description={
          pendingDelete
            ? `O item "${pendingDelete.name}" será removido do estoque.`
            : ''
        }
        confirmLabel="Excluir item"
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
