import { Link } from 'react-router-dom'
import type { Client } from '@/domain/types'
import { useClients } from '@/hooks/useClients'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { DataTable } from '@/presentation/components/ui/DataTable'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Spinner } from '@/presentation/components/ui/Spinner'

export function ClientsPage() {
  const { clients, loading, error, remove } = useClients()

  async function handleDelete(client: Client) {
    const confirmed = window.confirm(`Excluir o cliente "${client.name}"?`)
    if (!confirmed) return
    await remove(client.id)
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
      />

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {loading ? <Spinner /> : null}

      {!loading ? (
        <DataTable
          rows={clients}
          rowKey={(row) => row.id}
          emptyMessage="Nenhum cliente cadastrado."
          columns={[
            { key: 'name', header: 'Nome', render: (row) => row.name },
            { key: 'email', header: 'E-mail', render: (row) => row.email || '—' },
            { key: 'phone', header: 'Telefone', render: (row) => row.phone || '—' },
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
