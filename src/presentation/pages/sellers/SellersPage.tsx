import { Link } from 'react-router-dom'
import type { Seller } from '@/domain/types'
import { useSellers } from '@/hooks/useSellers'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { DataTable } from '@/presentation/components/ui/DataTable'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Spinner } from '@/presentation/components/ui/Spinner'

export function SellersPage() {
  const { sellers, loading, error, remove } = useSellers()

  async function handleDelete(seller: Seller) {
    const confirmed = window.confirm(`Excluir o vendedor "${seller.name}"?`)
    if (!confirmed) return
    await remove(seller.id)
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
          emptyMessage="Nenhum vendedor cadastrado."
          columns={[
            { key: 'name', header: 'Nome', render: (row) => row.name },
            { key: 'email', header: 'E-mail', render: (row) => row.email || '—' },
            { key: 'phone', header: 'Telefone', render: (row) => row.phone || '—' },
            {
              key: 'active',
              header: 'Status',
              render: (row) => (row.active ? 'Ativo' : 'Inativo'),
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
