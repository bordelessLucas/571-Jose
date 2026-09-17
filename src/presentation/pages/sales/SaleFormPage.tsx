import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type {
  InventoryItem,
  PaymentMethod,
  Sale,
  SaleInput,
} from '@/domain/types'
import { PAYMENT_METHOD_LABELS } from '@/domain/types'
import { AppError } from '@/lib/errors'
import {
  addDaysInputValue,
  computeSaleAmount,
  formatCurrency,
  formatDate,
  todayInputValue,
} from '@/lib/format'
import { useClients } from '@/hooks/useClients'
import { useInventory } from '@/hooks/useInventory'
import {
  useClientCommercialInsight,
  useSale,
  useSaleMutations,
} from '@/hooks/useSales'
import { useSellers } from '@/hooks/useSellers'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { Input } from '@/presentation/components/ui/Input'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Select } from '@/presentation/components/ui/Select'
import { Spinner } from '@/presentation/components/ui/Spinner'
import { StatusBadge } from '@/presentation/components/ui/StatusBadge'
import { TextArea } from '@/presentation/components/ui/TextArea'

const EMPTY_FORM: SaleInput = {
  clientId: '',
  sellerId: '',
  productId: '',
  quantity: 1,
  unitPrice: 0,
  deliveryFee: 0,
  paymentMethod1: 'pix',
  paymentFee1: 0,
  paymentMethod2: '',
  paymentFee2: 0,
  dueDate: addDaysInputValue(todayInputValue(), 30),
  description: '',
  soldAt: todayInputValue(),
}

const PAYMENT_OPTIONS = (
  Object.entries(PAYMENT_METHOD_LABELS) as [
    Exclude<PaymentMethod, ''>,
    string,
  ][]
).map(([value, label]) => ({ value, label }))

function toForm(sale: Sale | null): SaleInput {
  if (!sale) return EMPTY_FORM
  return {
    clientId: sale.clientId,
    sellerId: sale.sellerId,
    productId: sale.productId,
    quantity: sale.quantity || 1,
    unitPrice: sale.unitPrice || sale.amount,
    deliveryFee: sale.deliveryFee,
    paymentMethod1: sale.paymentMethod1 || 'pix',
    paymentFee1: sale.paymentFee1,
    paymentMethod2: sale.paymentMethod2,
    paymentFee2: sale.paymentFee2,
    dueDate: sale.dueDate || addDaysInputValue(sale.soldAt, 30),
    description: sale.description,
    soldAt: sale.soldAt,
  }
}

type SaleFormFieldsProps = {
  initial: SaleInput
  isEdit: boolean
  clientOptions: { value: string; label: string }[]
  sellerOptions: { value: string; label: string }[]
  products: InventoryItem[]
  onSubmit: (input: SaleInput) => Promise<void>
}

function ClientInsightPanel({ clientId }: { clientId: string }) {
  const { insight, loading, error } = useClientCommercialInsight(clientId)

  if (!clientId) return null

  const hasOverdue = Boolean(insight && insight.overdueDebt.length > 0)

  return (
    <section
      className={`rounded-[var(--radius-md)] border p-4 ${
        hasOverdue
          ? 'border-[var(--color-danger)] bg-red-50'
          : 'border-[var(--color-border)] bg-[var(--color-bg)]'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--color-text)]">
            Situação do cliente
          </h2>
          <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
            Últimas compras e débitos pendentes (vencidos e a vencer).
          </p>
        </div>
        {hasOverdue ? (
          <StatusBadge
            label={`Vencido ${formatCurrency(insight!.overdueTotal)}`}
            tone="danger"
          />
        ) : null}
      </div>

      {loading ? (
        <div className="mt-3">
          <Spinner label="Carregando histórico…" />
        </div>
      ) : null}
      {error ? (
        <div className="mt-3">
          <Alert tone="danger">{error}</Alert>
        </div>
      ) : null}

      {!loading && insight ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div>
            <h3 className="text-[13px] font-medium text-[var(--color-text-muted)]">
              Últimas compras
            </h3>
            {insight.recentSales.length === 0 ? (
              <p className="mt-2 text-[14px] text-[var(--color-text-muted)]">
                Nenhuma compra anterior.
              </p>
            ) : (
              <ul className="mt-2 space-y-2 text-[14px]">
                {insight.recentSales.map((sale) => (
                  <li key={sale.id} className="flex justify-between gap-2">
                    <span className="min-w-0 truncate">
                      {formatDate(sale.soldAt)}
                      {sale.productName ? ` — ${sale.productName}` : ''}
                    </span>
                    <span className="shrink-0 font-mono tabular-nums">
                      {formatCurrency(sale.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-[13px] font-medium text-[var(--color-danger)]">
              Débito vencido ({formatCurrency(insight.overdueTotal)})
            </h3>
            {insight.overdueDebt.length === 0 ? (
              <p className="mt-2 text-[14px] text-[var(--color-text-muted)]">
                Nenhum débito vencido.
              </p>
            ) : (
              <ul className="mt-2 space-y-2 text-[14px]">
                {insight.overdueDebt.slice(0, 5).map((item) => (
                  <li key={item.id} className="flex justify-between gap-2">
                    <span>Venc. {formatDate(item.dueDate)}</span>
                    <span className="font-mono font-medium tabular-nums text-[var(--color-danger)]">
                      {formatCurrency(item.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-[13px] font-medium text-[var(--color-text-muted)]">
              Débito a vencer ({formatCurrency(insight.upcomingTotal)})
            </h3>
            {insight.upcomingDebt.length === 0 ? (
              <p className="mt-2 text-[14px] text-[var(--color-text-muted)]">
                Nenhum débito a vencer.
              </p>
            ) : (
              <ul className="mt-2 space-y-2 text-[14px]">
                {insight.upcomingDebt.slice(0, 5).map((item) => (
                  <li key={item.id} className="flex justify-between gap-2">
                    <span>Venc. {formatDate(item.dueDate)}</span>
                    <span className="font-mono tabular-nums">
                      {formatCurrency(item.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}

function SaleFormFields({
  initial,
  isEdit,
  clientOptions,
  sellerOptions,
  products,
  onSubmit,
}: SaleFormFieldsProps) {
  const [form, setForm] = useState(initial)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dueDateTouched, setDueDateTouched] = useState(isEdit)
  useUnsavedChanges(!submitting && JSON.stringify(form) !== JSON.stringify(initial))

  const filteredSellers = useMemo(
    () =>
      sellerOptions.filter(
        (option) =>
          !option.label.includes('(inativo)') || option.value === form.sellerId,
      ),
    [sellerOptions, form.sellerId],
  )

  const selectedProduct = useMemo(
    () => products.find((item) => item.id === form.productId) ?? null,
    [products, form.productId],
  )

  const availableStock = useMemo(() => {
    if (!selectedProduct) return null
    if (isEdit && initial.productId === form.productId) {
      return selectedProduct.quantity + initial.quantity
    }
    return selectedProduct.quantity
  }, [selectedProduct, isEdit, initial.productId, initial.quantity, form.productId])

  const total = computeSaleAmount(form)

  const productOptions = products.map((item) => ({
    value: item.id,
    label: `${item.name} (estoque: ${item.quantity} ${item.unit})`,
  }))

  useEffect(() => {
    if (dueDateTouched) return
    setForm((prev) => ({
      ...prev,
      dueDate: addDaysInputValue(prev.soldAt || todayInputValue(), 30),
    }))
  }, [form.soldAt, dueDateTouched])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        ...form,
        paymentFee2: form.paymentMethod2 ? form.paymentFee2 : 0,
      })
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Não foi possível salvar a venda.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event)
      }}
      className="mt-4 flex flex-col gap-4"
    >
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <Select
          label="Cliente"
          name="clientId"
          value={form.clientId}
          placeholder="Selecione…"
          options={clientOptions}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, clientId: event.target.value }))
          }
          required
        />
      </div>

      {form.clientId ? <ClientInsightPanel clientId={form.clientId} /> : null}

      <div className="flex flex-col gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <Select
          label="Vendedor"
          name="sellerId"
          value={form.sellerId}
          placeholder="Selecione…"
          options={filteredSellers}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, sellerId: event.target.value }))
          }
          required
        />

        <Select
          label="Produto"
          name="productId"
          value={form.productId}
          placeholder="Selecione…"
          options={productOptions}
          onChange={(event) => {
            const product = products.find((item) => item.id === event.target.value)
            setForm((prev) => ({
              ...prev,
              productId: event.target.value,
              unitPrice: prev.unitPrice > 0 ? prev.unitPrice : 0,
              description:
                prev.description ||
                (product ? product.name : prev.description),
            }))
          }}
          required
        />

        {selectedProduct && availableStock !== null ? (
          <p className="text-[13px] text-[var(--color-text-muted)]">
            Estoque disponível:{' '}
            <strong className="text-[var(--color-text)]">
              {availableStock} {selectedProduct.unit}
            </strong>
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Quantidade"
            name="quantity"
            type="number"
            min="0.01"
            step="0.01"
            value={form.quantity || ''}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                quantity: Number.parseFloat(event.target.value) || 0,
              }))
            }
            required
          />
          <Input
            label="Valor unitário (R$)"
            name="unitPrice"
            type="number"
            min="0.01"
            step="0.01"
            value={form.unitPrice || ''}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                unitPrice: Number.parseFloat(event.target.value) || 0,
              }))
            }
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Forma de pagamento 1"
            name="paymentMethod1"
            value={form.paymentMethod1}
            placeholder="Selecione…"
            options={PAYMENT_OPTIONS}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                paymentMethod1: event.target.value as PaymentMethod,
              }))
            }
            required
          />
          <Input
            label="Taxa forma 1 (R$)"
            name="paymentFee1"
            type="number"
            min="0"
            step="0.01"
            value={form.paymentFee1 || ''}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                paymentFee1: Number.parseFloat(event.target.value) || 0,
              }))
            }
          />
          <Select
            label="Forma de pagamento 2"
            name="paymentMethod2"
            value={form.paymentMethod2}
            placeholder="Opcional…"
            options={PAYMENT_OPTIONS}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                paymentMethod2: event.target.value as PaymentMethod,
                paymentFee2: event.target.value ? prev.paymentFee2 : 0,
              }))
            }
          />
          <Input
            label="Taxa forma 2 (R$)"
            name="paymentFee2"
            type="number"
            min="0"
            step="0.01"
            value={form.paymentFee2 || ''}
            disabled={!form.paymentMethod2}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                paymentFee2: Number.parseFloat(event.target.value) || 0,
              }))
            }
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Taxa de entrega (R$)"
            name="deliveryFee"
            type="number"
            min="0"
            step="0.01"
            value={form.deliveryFee || ''}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                deliveryFee: Number.parseFloat(event.target.value) || 0,
              }))
            }
          />
          <Input
            label="Data de vencimento"
            name="dueDate"
            type="date"
            value={form.dueDate}
            onChange={(event) => {
              setDueDateTouched(true)
              setForm((prev) => ({ ...prev, dueDate: event.target.value }))
            }}
            required
          />
          <Input
            label="Data da venda"
            name="soldAt"
            type="date"
            value={form.soldAt}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, soldAt: event.target.value }))
            }
            required
          />
          <div className="flex flex-col justify-end rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
            <span className="text-[13px] text-[var(--color-text-muted)]">Total</span>
            <span className="font-mono text-[18px] font-semibold">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        <TextArea
          label="Descrição / observações"
          name="description"
          value={form.description}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, description: event.target.value }))
          }
        />

        <p className="text-[13px] text-[var(--color-text-muted)]">
          O vencimento inicia em 30 dias a partir da data da venda. A venda gera
          conta a receber e baixa o estoque do produto.
        </p>

        <Button type="submit" disabled={submitting}>
          {submitting ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Salvar venda'}
        </Button>
      </div>
    </form>
  )
}

export function SaleFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { create, update } = useSaleMutations()
  const { sale, loading: saleLoading, error: saleError } = useSale(id)
  const { clients, loading: clientsLoading } = useClients()
  const { sellers, loading: sellersLoading } = useSellers()
  const { items: products, loading: productsLoading } = useInventory()

  if ((isEdit && saleLoading) || clientsLoading || sellersLoading || productsLoading) {
    return <Spinner />
  }

  if (isEdit && !sale) {
    return <Alert tone="danger">{saleError ?? 'Venda não encontrada.'}</Alert>
  }

  const clientOptions = clients.map((client) => ({
    value: client.id,
    label: [client.name, client.phone, client.address].filter(Boolean).join(' — '),
  }))

  const sellerOptions = sellers.map((seller) => ({
    value: seller.id,
    label: seller.active ? seller.name : `${seller.name} (inativo)`,
  }))

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={isEdit ? 'Editar venda' : 'Nova venda'}
        description="Cliente, produto, estoque, pagamentos, taxas e vencimento em 30 dias."
        backTo={isEdit && id ? `/vendas/${id}` : '/vendas'}
      />

      {clients.length === 0 ? (
        <div className="mb-4">
          <Alert tone="warning">
            Cadastre ao menos um cliente antes de registrar a venda.
          </Alert>
          <div className="mt-2">
            <Link to="/clientes/novo">
              <Button variant="secondary">Novo cliente</Button>
            </Link>
          </div>
        </div>
      ) : null}

      {products.length === 0 ? (
        <div className="mb-4">
          <Alert tone="warning">
            Cadastre um item de estoque para selecionar o produto na venda.
          </Alert>
          <div className="mt-2">
            <Link to="/estoque/novo">
              <Button variant="secondary">Novo item</Button>
            </Link>
          </div>
        </div>
      ) : null}

      <SaleFormFields
        key={sale?.id ?? 'new-sale'}
        initial={toForm(sale)}
        isEdit={isEdit}
        clientOptions={clientOptions}
        sellerOptions={sellerOptions}
        products={products}
        onSubmit={async (input) => {
          if (isEdit && id) {
            await update(id, input)
            void navigate(`/vendas/${id}`)
          } else {
            const createdId = await create(input)
            void navigate(`/vendas/${createdId}`)
          }
        }}
      />
    </div>
  )
}
