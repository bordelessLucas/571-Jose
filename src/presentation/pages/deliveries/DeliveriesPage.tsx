import { useMemo, useState } from 'react'
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
import { StatusBadge } from '@/presentation/components/ui/StatusBadge'

const DELIVERY_COLUMNS: DeliveryStatus[] = [
  'pending',
  'assigned',
  'out_for_delivery',
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

  const deliverySales = useMemo(
    () => sales.filter((sale) => sale.soldAt === closingDate),
    [sales, closingDate],
  )

  const activeSellers = sellers
    .filter((seller) => seller.active)
    .map((seller) => ({ value: seller.id, label: seller.name }))

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
    try {
      await action()
      await refresh()
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
      {loading ? <Spinner /> : null}

      {!loading ? (
        <>
          <section className="grid gap-3 xl:grid-cols-4">
            {DELIVERY_COLUMNS.map((status) => {
              const rows = deliverySales.filter((sale) => sale.deliveryStatus === status)
              return (
                <div
                  key={status}
                  className="surface-panel rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="font-semibold text-[var(--color-text)]">
                      {DELIVERY_STATUS_LABELS[status]}
                    </h2>
                    <StatusBadge label={String(rows.length)} tone="info" />
                  </div>
                  <div className="space-y-3">
                    {rows.length === 0 ? (
                      <p className="text-sm text-[var(--color-text-muted)]">
                        Nenhum pedido.
                      </p>
                    ) : null}
                    {rows.map((sale) => (
                      <article
                        key={sale.id}
                        className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                      >
                        <p className="font-medium text-[var(--color-text)]">
                          {sale.clientName}
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                          {[sale.clientPhone, sale.clientAddress].filter(Boolean).join(' - ')}
                        </p>
                        <p className="mt-2 text-sm">
                          {sale.productName} x {sale.quantity}
                        </p>
                        <p className="mt-1 font-mono text-sm tabular-nums">
                          {formatCurrency(sale.amount)} - {paymentLabel(sale)}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {status === 'pending' ? (
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
                          ) : null}
                          {status === 'assigned' ? (
                            <Button
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
                          {status === 'out_for_delivery' ? (
                            <Button
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
                          {sale.deliveryPersonName ? (
                            <Button
                              variant="ghost"
                              onClick={() => {
                                const phone = ''
                                const text = encodeURIComponent(whatsappMessage(sale))
                                window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
                              }}
                            >
                              Enviar para entregador
                            </Button>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )
            })}
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
