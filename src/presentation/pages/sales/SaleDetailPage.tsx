import { Link, useParams } from 'react-router-dom'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import { useSale } from '@/hooks/useSales'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Spinner } from '@/presentation/components/ui/Spinner'

export function SaleDetailPage() {
  const { id } = useParams()
  const { sale, loading, error } = useSale(id)

  if (loading) {
    return <Spinner />
  }

  if (error) {
    return <Alert tone="danger">{error}</Alert>
  }

  if (!sale) {
    return <Alert tone="danger">Venda não encontrada.</Alert>
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Detalhes da venda"
        description="Principais dados comerciais do registro."
        actions={
          <div className="flex gap-2">
            <Link to="/vendas">
              <Button variant="secondary">Voltar</Button>
            </Link>
            <Link to={`/vendas/${sale.id}/editar`}>
              <Button>Editar</Button>
            </Link>
          </div>
        }
      />

      <dl className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:grid-cols-2">
        <div>
          <dt className="text-[13px] font-medium text-[var(--color-text-muted)]">Data</dt>
          <dd className="mt-1 text-[15px]">{formatDate(sale.soldAt)}</dd>
        </div>
        <div>
          <dt className="text-[13px] font-medium text-[var(--color-text-muted)]">Valor</dt>
          <dd className="mt-1 font-mono text-[15px]">{formatCurrency(sale.amount)}</dd>
        </div>
        <div>
          <dt className="text-[13px] font-medium text-[var(--color-text-muted)]">Cliente</dt>
          <dd className="mt-1 text-[15px]">{sale.clientName}</dd>
        </div>
        <div>
          <dt className="text-[13px] font-medium text-[var(--color-text-muted)]">Vendedor</dt>
          <dd className="mt-1 text-[15px]">{sale.sellerName}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[13px] font-medium text-[var(--color-text-muted)]">
            Descrição
          </dt>
          <dd className="mt-1 text-[15px]">{sale.description || '—'}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[13px] font-medium text-[var(--color-text-muted)]">
            Registrado em
          </dt>
          <dd className="mt-1 text-[15px]">{formatDateTime(sale.createdAt)}</dd>
        </div>
      </dl>
    </div>
  )
}
