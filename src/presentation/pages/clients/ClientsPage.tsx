import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Client } from '@/domain/types'
import { useClients } from '@/hooks/useClients'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { ConfirmDialog } from '@/presentation/components/ui/ConfirmDialog'
import { DataTable } from '@/presentation/components/ui/DataTable'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Spinner } from '@/presentation/components/ui/Spinner'

export function ClientsPage() {
  const { clients, loading, error, remove } = useClients()
  const [pendingDelete, setPendingDelete] = useState<Client | null>(null)
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
        title="Clientes"
        description="Cadastro e consulta dos clientes utilizados nas vendas."
        showDashboard
        actions={
          <Link to="/clientes/novo">
            <Button>Novo cliente</Button>
          </Link>
        }
        meta={
          !loading ? (
            <p className="text-[13px] text-[var(--color-text-muted)]">
              {clients.length} clientes
            </p>
          ) : null
        }
      />

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {loading ? <Spinner /> : null}

      {!loading ? (
        <DataTable
          rows={clients}
          rowKey={(row) => row.id}
          emptyTitle="Nenhum cliente cadastrado"
          emptyDescription="Cadastre clientes para usá-los nas vendas e no controle de débitos."
          emptyAction={
            <Link to="/clientes/novo">
              <Button>Novo cliente</Button>
            </Link>
          }
          columns={[
            { key: 'name', header: 'Nome', render: (row) => row.name },
            { key: 'email', header: 'E-mail', render: (row) => row.email || '—' },
            { key: 'phone', header: 'Telefone', render: (row) => row.phone || '—' },
            {
              key: 'address',
              header: 'Endereço',
              render: (row) => (
                <span className="line-clamp-2 max-w-xs">{row.address || '—'}</span>
              ),
            },
            {
              key: 'document',
              header: 'Documento',
              render: (row) => row.document || '—',
            },
            {
              key: 'actions',
              header: 'Ações',
              align: 'right',
              render: (row) => (
                <div className="flex flex-wrap justify-end gap-2">
                  <Link to={`/clientes/${row.id}`}>
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
        title="Excluir cliente?"
        description={
          pendingDelete
            ? `O cliente "${pendingDelete.name}" será removido do cadastro.`
            : ''
        }
        confirmLabel="Excluir cliente"
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
