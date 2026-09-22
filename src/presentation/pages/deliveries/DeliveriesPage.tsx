import { useMemo, useState } from 'react'
import { WhatsappLogo } from '@phosphor-icons/react'
import type { DeliveryStatus, Sale } from '@/domain/types'
import { DELIVERY_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/domain/types'
import { formatCurrency, todayInputValue } from '@/lib/format'
import {
  addSaleToPaymentTotals,
  emptySalePaymentTotals,
} from '@/lib/salePaymentTotals'
import { useSales, useSaleMutations } from '@/hooks/useSales'
import { useSellers } from '@/hooks/useSellers'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { Input } from '@/presentation/components/ui/Input'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Select } from '@/presentation/components/ui/Select'
import { Spinner } from '@/presentation/components/ui/Spinner'

const DELIVERY_COLUMNS: DeliveryStatus[] = [
  'pending',
  'assigned',
  'out_for_delivery',
  'cancelled',
  'delivered',
]

function paymentLabel(sale: Sale): string {
  const first = sale.paymentMethod1 ? PAYMENT_METHOD_LABELS[sale.paymentMethod1] : ''
  const second = sale.paymentMethod2 ? PAYMENT_METHOD_LABELS[sale.paymentMethod2] : ''
  return [first, second].filter(Boolean).join(' + ') || 'Nao informado'
}

function whatsappMessage(sale: Sale): string {
  return [
    `Cliente: ${sale.clientName}`,
    `Telefone: ${sale.clientPhone}`,
    `Endereco: ${sale.clientAddress}`,
    `Produto: ${sale.productName} x ${sale.quantity}`,
    `Valor: ${formatCurrency(sale.amount)}`,
    `Pagamento: ${paymentLabel(sale)}`,
    sale.description ? `Obs.: ${sale.description}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

export function DeliveriesPage() {
  const { sales, loading, error, refresh } = useSales()
  const { sellers } = useSellers()
  const { assignDeliveryPerson, updateDeliveryStatus } = useSaleMutations()
  const [busySaleId, setBusySaleId] = useState<string | null>(null)
  const [closingDate, setClosingDate] = useState(todayInputValue())
  const [actionError, setActionError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<DeliveryStatus>('assigned')

  const deliverySales = useMemo(
    () => sales.filter((sale) => sale.soldAt === closingDate),
    [sales, closingDate],
  )

  const activeSellers = sellers
    .filter((seller) => seller.active)
    .map((seller) => ({ value: seller.id, label: seller.name }))

  const sellerById = useMemo(
    () => new Map(sellers.map((seller) => [seller.id, seller])),
    [sellers],
  )

  const statusSummaries = useMemo(
    () =>
      DELIVERY_COLUMNS.map((status) => {
        const rows = deliverySales.filter((sale) => sale.deliveryStatus === status)
        return {
          status,
          label: DELIVERY_STATUS_LABELS[status],
          count: rows.length,
          total: rows.reduce((sum, sale) => sum + sale.amount, 0),
        }
      }),
    [deliverySales],
  )

  const selectedRows = useMemo(
    () => deliverySales.filter((sale) => sale.deliveryStatus === selectedStatus),
    [deliverySales, selectedStatus],
  )

  const closing = useMemo(() => {
    const groups = new Map<
      string,
      {
        name: string
        deliveries: number
        salesTotal: number
        cashTotal: number
        pixTotal: number
        creditTotal: number
        accountabilityTotal: number
      }
    >()

    for (const sale of deliverySales.filter((item) => item.deliveryPersonId)) {
      const key = sale.deliveryPersonId ?? ''
      const current =
        groups.get(key) ??
        {
          name: sale.deliveryPersonName ?? 'Sem entregador',
          deliveries: 0,
          salesTotal: 0,
          cashTotal: 0,
          pixTotal: 0,
          creditTotal: 0,
          accountabilityTotal: 0,
        }

      current.deliveries += sale.deliveryStatus === 'delivered' ? 1 : 0
      current.salesTotal += sale.amount
      const totals = addSaleToPaymentTotals(emptySalePaymentTotals(), sale)
      current.cashTotal += totals.dinheiro
      current.pixTotal += totals.pix
      current.creditTotal += totals.fiado
      current.accountabilityTotal += totals.dinheiro
      groups.set(key, current)
    }

    return Array.from(groups.values())
  }, [deliverySales])

  async function runSaleAction(saleId: string, action: () => Promise<void>) {
    setBusySaleId(saleId)
    setActionError(null)
    try {
      await action()
      await refresh()
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Nao foi possivel atualizar a entrega.',
      )
    } finally {
      setBusySaleId(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Entregas"
        description="Acompanhe pedidos, entregadores e fechamento diario."
        showDashboard
      />

      <div className="mb-4 max-w-xs">
        <Input
          label="Data do fechamento"
          name="closingDate"
          type="date"
          value={closingDate}
          onChange={(event) => setClosingDate(event.target.value)}
        />
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {actionError ? <Alert tone="danger">{actionError}</Alert> : null}
      {loading ? <Spinner /> : null}

      {!loading ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {statusSummaries.map((summary) => {
              const active = summary.status === selectedStatus
              return (
                <button
                  key={summary.status}
                  type="button"
                  className={`min-h-[132px] rounded-[var(--radius-md)] border p-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 ${
                    active
                      ? 'border-[var(--color-primary)] bg-[var(--color-surface)] shadow-[0_12px_30px_rgb(15_76_92_/_0.14)]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-muted)]'
                  }`}
                  onClick={() => setSelectedStatus(summary.status)}
                >
                  <div className="flex h-full flex-col justify-between gap-4">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-[15px] font-semibold text-[var(--color-text)]">
                        {summary.label}
                      </h2>
                      <span
                        className={`rounded-[var(--radius-sm)] border px-2 py-1 text-[13px] font-semibold ${
                          active
                            ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                            : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                        }`}
                      >
                        {summary.count}
                      </span>
                    </div>
                    <div>
                      <p className="font-mono text-lg font-semibold tabular-nums text-[var(--color-text)]">
                        {formatCurrency(summary.total)}
                      </p>
                      <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">
                        {summary.count === 1 ? '1 pedido' : `${summary.count} pedidos`}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </section>

          <section className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                  {DELIVERY_STATUS_LABELS[selectedStatus]}
                </h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {selectedRows.length === 1
                    ? '1 pedido nesta fase.'
                    : `${selectedRows.length} pedidos nesta fase.`}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {selectedRows.length === 0 ? (
                <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] p-6 text-sm text-[var(--color-text-muted)]">
                  Nenhum pedido nesta fase.
                </div>
              ) : null}
              {selectedRows.map((sale) => (
                <article
                  key={sale.id}
                  className="flex min-h-[260px] flex-col rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-semibold text-[var(--color-text)]">
                      {sale.clientName}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-muted)]">
                      {[sale.clientPhone, sale.clientAddress].filter(Boolean).join(' - ')}
                    </p>
                    {sale.deliveryPersonName ? (
                      <p className="mt-2 text-[13px] text-[var(--color-text-muted)]">
                        Entregador: <span className="font-medium text-[var(--color-text)]">{sale.deliveryPersonName}</span>
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm">
                    <p className="font-medium text-[var(--color-text)]">
                      {sale.productName} x {sale.quantity}
                    </p>
                    <p className="mt-1 font-mono tabular-nums">
                      {formatCurrency(sale.amount)} - {paymentLabel(sale)}
                    </p>
                  </div>

                  <div className="mt-auto grid gap-2 pt-4 sm:grid-cols-2">
                    {selectedStatus === 'pending' ? (
                      <div className="sm:col-span-2">
                        <Select
                          label="Entregador"
                          name={`seller-${sale.id}`}
                          value={sale.deliveryPersonId ?? ''}
                          placeholder="Selecionar..."
                          options={activeSellers}
                          onChange={(event) => {
                            const deliveryPersonId = event.target.value
                            if (!deliveryPersonId) return
                            void runSaleAction(sale.id, () =>
                              assignDeliveryPerson(sale.id, deliveryPersonId),
                            )
                          }}
                        />
                      </div>
                    ) : null}
                    {selectedStatus === 'assigned' ? (
                      <Button
                        className="min-h-[44px] w-full"
                        variant="secondary"
                        disabled={busySaleId === sale.id}
                        onClick={() =>
                          void runSaleAction(sale.id, () =>
                            updateDeliveryStatus(sale.id, 'out_for_delivery'),
                          )
                        }
                      >
                        Saiu para entrega
                      </Button>
                    ) : null}
                    {selectedStatus === 'out_for_delivery' ? (
                      <Button
                        className="min-h-[44px] w-full"
                        disabled={busySaleId === sale.id}
                        onClick={() =>
                          void runSaleAction(sale.id, () =>
                            updateDeliveryStatus(sale.id, 'delivered'),
                          )
                        }
                      >
                        Marcar entregue
                      </Button>
                    ) : null}
                    {selectedStatus !== 'delivered' && selectedStatus !== 'cancelled' ? (
                      <Button
                        className="min-h-[44px] w-full"
                        variant="danger"
                        disabled={busySaleId === sale.id}
                        onClick={() =>
                          void runSaleAction(sale.id, () =>
                            updateDeliveryStatus(sale.id, 'cancelled'),
                          )
                        }
                      >
                        Cancelar
                      </Button>
                    ) : null}
                    {sale.deliveryPersonName ? (
                      <Button
                        className="min-h-[44px] w-full sm:col-span-2"
                        variant="secondary"
                        title="Abrir WhatsApp do entregador com os dados do pedido"
                        onClick={() => {
                          const phone = sellerById.get(sale.deliveryPersonId ?? '')?.phone
                          const text = encodeURIComponent(whatsappMessage(sale))
                          const digits = phone?.replace(/\D/g, '') ?? ''
                          const url = digits
                            ? `https://wa.me/${digits}?text=${text}`
                            : `https://wa.me/?text=${text}`
                          window.open(url, '_blank')
                        }}
                      >
                        <WhatsappLogo size={18} weight="bold" />
                        Enviar por WhatsApp
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-5 surface-panel rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              Fechamento por entregador
            </h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {closing.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">
                  Nenhuma entrega atribuida na data.
                </p>
              ) : null}
              {closing.map((item) => (
                <div
                  key={item.name}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                >
                  <h3 className="font-semibold">{item.name}</h3>
                  <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <dt>Entregas</dt>
                    <dd className="text-right font-mono">{item.deliveries}</dd>
                    <dt>Vendas</dt>
                    <dd className="text-right font-mono">{formatCurrency(item.salesTotal)}</dd>
                    <dt>Dinheiro</dt>
                    <dd className="text-right font-mono">{formatCurrency(item.cashTotal)}</dd>
                    <dt>PIX</dt>
                    <dd className="text-right font-mono">{formatCurrency(item.pixTotal)}</dd>
                    <dt>Fiado</dt>
                    <dd className="text-right font-mono">{formatCurrency(item.creditTotal)}</dd>
                    <dt>A prestar contas</dt>
                    <dd className="text-right font-mono font-semibold">
                      {formatCurrency(item.accountabilityTotal)}
                    </dd>
                  </dl>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
