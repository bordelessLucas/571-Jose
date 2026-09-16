import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FISCAL_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/domain/types'
import type { PaymentMethod } from '@/domain/types'
import { AppError } from '@/lib/errors'
import { formatCurrency, formatDate, formatDateTime, todayInputValue } from '@/lib/format'
import { useSale, useSaleMutations } from '@/hooks/useSales'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { ConfirmDialog } from '@/presentation/components/ui/ConfirmDialog'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Spinner } from '@/presentation/components/ui/Spinner'
import {
  StatusBadge,
  fiscalStatusTone,
} from '@/presentation/components/ui/StatusBadge'

function paymentLabel(method: PaymentMethod): string {
  if (!method) return '—'
  return PAYMENT_METHOD_LABELS[method]
}

function Field({
  label,
  children,
  wide,
}: {
  label: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-[13px] font-medium text-[var(--color-text-muted)]">{label}</dt>
      <dd className="mt-1 text-[15px] text-[var(--color-text)]">{children}</dd>
    </div>
  )
}

export function SaleDetailPage() {
  const { id } = useParams()
  const { sale, loading, error, refresh } = useSale(id)
  const { reemitNfe } = useSaleMutations()
  const [reemitting, setReemitting] = useState(false)
  const [confirmReemit, setConfirmReemit] = useState(false)
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

  const overdue = Boolean(sale.dueDate && sale.dueDate < todayInputValue())

  async function handleReemit() {
    if (!sale) return
    setReemitting(true)
    setFiscalError(null)
    setFiscalMessage(null)
    try {
      await reemitNfe(sale.id)
      refresh()
      setFiscalMessage('NF-e reprocessada. O documento anterior ativo foi cancelado.')
      setConfirmReemit(false)
    } catch (err) {
      setFiscalError(
        err instanceof AppError ? err.message : 'Falha ao reprocessar NF-e.',
      )
    } finally {
      setReemitting(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Detalhes da venda"
        description="Dados comerciais, pagamentos, vencimento e status da NF-e."
        backTo="/vendas"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to={`/vendas/${sale.id}/editar`}>
              <Button>Editar</Button>
            </Link>
            <Button
              variant="secondary"
              disabled={reemitting}
              onClick={() => setConfirmReemit(true)}
            >
              Reemitir NF-e
            </Button>
          </div>
        }
      />

      {fiscalMessage ? <Alert tone="success">{fiscalMessage}</Alert> : null}
      {fiscalError ? <Alert tone="danger">{fiscalError}</Alert> : null}

      <section
        className={`mb-4 rounded-[var(--radius-md)] border p-4 ${
          sale.fiscalStatus === 'error' || sale.fiscalStatus === 'rejected'
            ? 'border-[var(--color-danger)] bg-red-50'
            : sale.fiscalStatus === 'authorized'
              ? 'border-emerald-200 bg-emerald-50/60'
              : 'border-[var(--color-border)] bg-[var(--color-surface)]'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-[var(--color-text-muted)]">
              Situação fiscal (NF-e)
            </p>
            <div className="mt-2">
              {sale.fiscalStatus ? (
                <StatusBadge
                  label={FISCAL_STATUS_LABELS[sale.fiscalStatus]}
                  tone={fiscalStatusTone(sale.fiscalStatus)}
                />
              ) : (
                <StatusBadge label="Não emitida" tone="muted" />
              )}
            </div>
            <p className="mt-2 font-mono text-[13px] text-[var(--color-text-muted)]">
              Ref. Focus: {sale.fiscalRef || '—'}
            </p>
          </div>
          {sale.receivableId ? (
            <Link to="/financeiro/receber">
              <Button variant="ghost">Ver contas a receber</Button>
            </Link>
          ) : null}
        </div>
      </section>

      <dl className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:grid-cols-2">
        <Field label="Data">{formatDate(sale.soldAt)}</Field>
        <Field label="Vencimento">
          <span className={overdue ? 'font-medium text-[var(--color-danger)]' : ''}>
            {sale.dueDate ? formatDate(sale.dueDate) : '—'}
            {overdue ? ' · vencido' : ''}
          </span>
        </Field>
        <Field label="Cliente">{sale.clientName}</Field>
        <Field label="Contato">
          {[sale.clientPhone, sale.clientAddress].filter(Boolean).join(' · ') || '—'}
        </Field>
        <Field label="Vendedor">{sale.sellerName}</Field>
        <Field label="Produto">
          {sale.productName ? `${sale.productName} × ${sale.quantity}` : '—'}
        </Field>
        <Field label="Valor unitário">
          <span className="font-mono tabular-nums">{formatCurrency(sale.unitPrice)}</span>
        </Field>
        <Field label="Taxa de entrega">
          <span className="font-mono tabular-nums">{formatCurrency(sale.deliveryFee)}</span>
        </Field>
        <Field label="Pagamento 1">
          {paymentLabel(sale.paymentMethod1)}
          {sale.paymentFee1 > 0
            ? ` · taxa ${formatCurrency(sale.paymentFee1)}`
            : ''}
        </Field>
        <Field label="Pagamento 2">
          {sale.paymentMethod2
            ? `${paymentLabel(sale.paymentMethod2)}${
                sale.paymentFee2 > 0
                  ? ` · taxa ${formatCurrency(sale.paymentFee2)}`
                  : ''
              }`
            : '—'}
        </Field>
        <Field label="Total">
          <span className="font-mono text-[16px] font-semibold tabular-nums">
            {formatCurrency(sale.amount)}
          </span>
        </Field>
        <Field label="Descrição" wide>
          {sale.description || '—'}
        </Field>
        <Field label="Registrado em" wide>
          {formatDateTime(sale.createdAt)}
        </Field>
      </dl>

      <ConfirmDialog
        open={confirmReemit}
        title="Reemitir NF-e?"
        description="O documento fiscal ativo desta venda será cancelado e uma nova referência Focus será gerada. Confirme apenas se precisar corrigir ou reprocessar a nota."
        confirmLabel="Reemitir NF-e"
        cancelLabel="Manter atual"
        tone="primary"
        busy={reemitting}
        onCancel={() => {
          if (!reemitting) setConfirmReemit(false)
        }}
        onConfirm={() => {
          void handleReemit()
        }}
      />
    </div>
  )
}
