import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Seller } from '@/domain/types'
import { useSellers } from '@/hooks/useSellers'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { ConfirmDialog } from '@/presentation/components/ui/ConfirmDialog'
import { DataTable } from '@/presentation/components/ui/DataTable'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Spinner } from '@/presentation/components/ui/Spinner'
import { StatusBadge } from '@/presentation/components/ui/StatusBadge'

export function SellersPage() {
  const { sellers, loading, error, remove } = useSellers()
  const [pendingDelete, setPendingDelete] = useState<Seller | null>(null)
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
        title="Vendedores"
        description="Cadastro e consulta de vendedores associados às vendas."
        showDashboard
        actions={
          <Link to="/vendedores/novo">
            <Button>Novo vendedor</Button>
          </Link>
        }
      />

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {loading ? <Spinner /> : null}

      {!loading ? (
        <DataTable
          rows={sellers}
          rowKey={(row) => row.id}
          emptyTitle="Nenhum vendedor cadastrado"
          emptyDescription="Cadastre vendedores ativos para associá-los às vendas."
          emptyAction={
            <Link to="/vendedores/novo">
              <Button>Novo vendedor</Button>
            </Link>
          }
          columns={[
            { key: 'name', header: 'Nome', render: (row) => row.name },
            { key: 'email', header: 'E-mail', render: (row) => row.email || '—' },
            { key: 'phone', header: 'Telefone', render: (row) => row.phone || '—' },
            {
              key: 'active',
              header: 'Status',
              render: (row) => (
                <StatusBadge
                  label={row.active ? 'Ativo' : 'Inativo'}
                  tone={row.active ? 'success' : 'muted'}
                />
              ),
            },
            {
              key: 'actions',
              header: 'Ações',
              align: 'right',
              render: (row) => (
                <div className="flex flex-wrap justify-end gap-2">
                  <Link to={`/vendedores/${row.id}`}>
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
        title="Excluir vendedor?"
        description={
          pendingDelete
            ? `O vendedor "${pendingDelete.name}" será removido do cadastro.`
            : ''
        }
        confirmLabel="Excluir vendedor"
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
