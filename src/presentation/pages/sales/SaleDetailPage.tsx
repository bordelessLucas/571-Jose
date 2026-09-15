import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FISCAL_STATUS_LABELS } from '@/domain/types'
import { AppError } from '@/lib/errors'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import { useSale, useSaleMutations } from '@/hooks/useSales'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Spinner } from '@/presentation/components/ui/Spinner'

export function SaleDetailPage() {
  const { id } = useParams()
  const { sale, loading, error, refresh } = useSale(id)
  const { reemitNfe } = useSaleMutations()
  const [reemitting, setReemitting] = useState(false)
  const [fiscalMessage, setFiscalMessage] = useState<string | null>(null)
  const [fiscalError, setFiscalError] = useState<string | null>(null)

  if (loading) {
    return <Spinner />
  }

  if (error) {
    return <Alert tone="danger">{error}</Alert>
  }

  if (!sale) {
    return <Alert tone="danger">Venda não encontrada.</Alert>
  }

  async function handleReemit() {
    if (!sale) return
    setReemitting(true)
    setFiscalError(null)
    setFiscalMessage(null)
    try {
      await reemitNfe(sale.id)
      refresh()
      setFiscalMessage('NF-e reprocessada com sucesso.')
    } catch (err) {
      setFiscalError(
        err instanceof AppError ? err.message : 'Falha ao reprocessar NF-e.',
      )
    } finally {
      setReemitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Detalhes da venda"
        description="Dados comerciais e status da NF-e (Focus NFe)."
        backTo="/vendas"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to={`/vendas/${sale.id}/editar`}>
              <Button>Editar</Button>
            </Link>
            <Button
              variant="secondary"
              disabled={reemitting}
              onClick={() => {
                void handleReemit()
              }}
            >
              {reemitting ? 'Reemitindo…' : 'Reemitir NF-e'}
            </Button>
          </div>
        }
      />

      {fiscalMessage ? <Alert tone="success">{fiscalMessage}</Alert> : null}
      {fiscalError ? <Alert tone="danger">{fiscalError}</Alert> : null}

      <dl className="mt-4 grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:grid-cols-2">
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
        <div>
          <dt className="text-[13px] font-medium text-[var(--color-text-muted)]">Status NF-e</dt>
          <dd className="mt-1 text-[15px]">
            {sale.fiscalStatus
              ? FISCAL_STATUS_LABELS[sale.fiscalStatus]
              : 'Não emitida'}
          </dd>
        </div>
        <div>
          <dt className="text-[13px] font-medium text-[var(--color-text-muted)]">
            Ref. Focus
          </dt>
          <dd className="mt-1 font-mono text-[14px]">{sale.fiscalRef || '—'}</dd>
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
