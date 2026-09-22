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
import { StatusBadge } from '@/presentation/components/ui/StatusBadge'

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
          emptyDescription="Cadastre clientes para usa-los nas vendas e no controle de debitos."
          emptyAction={
            <Link to="/clientes/novo">
              <Button>Novo cliente</Button>
            </Link>
          }
          columns={[
            {
              key: 'name',
              header: 'Nome',
              render: (row) => (
                <div className="min-w-[180px]">
                  <p className="font-medium">{row.name}</p>
                  <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
                    {row.document || 'Sem documento'}
                  </p>
                </div>
              ),
            },
            {
              key: 'contact',
              header: 'Contato',
              render: (row) => (
                <div className="min-w-[190px] text-[13px] leading-5">
                  <p>{row.phone || '-'}</p>
                  <p className="truncate text-[var(--color-text-muted)]">
                    {row.email || 'Sem e-mail'}
                  </p>
                </div>
              ),
            },
            {
              key: 'address',
              header: 'Endereco fiscal',
              render: (row) => (
                <span className="line-clamp-2 max-w-[260px]">
                  {[row.city, row.state].filter(Boolean).join('/') ||
                    row.address ||
                    '-'}
                </span>
              ),
            },
            {
              key: 'fiscal',
              header: 'Fiscal',
              render: (row) =>
                row.address && row.city && row.state && row.zipCode ? (
                  <StatusBadge label="Completo" tone="success" />
                ) : (
                  <StatusBadge label="Pendente" tone="warning" />
                ),
            },
            {
              key: 'actions',
              header: 'Acoes',
              align: 'right',
              render: (row) => (
                <div className="flex min-w-[150px] flex-wrap justify-end gap-2">
                  <Link to={`/clientes/${row.id}`}>
                    <Button variant="secondary">Editar</Button>
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
            ? `O cliente "${pendingDelete.name}" sera removido do cadastro.`
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
