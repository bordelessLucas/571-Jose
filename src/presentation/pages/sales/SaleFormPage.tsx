import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type {
  Client,
  ClientInput,
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
  paymentAmount1: 0,
  paymentFee1: 0,
  paymentMethod2: '',
  paymentAmount2: 0,
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

const EMPTY_CLIENT_FORM: ClientInput = {
  name: '',
  email: '',
  phone: '',
  address: '',
  addressNumber: '',
  district: '',
  city: '',
  state: '',
  zipCode: '',
  document: '',
  stateRegistration: '',
  stateRegistrationIndicator: '9',
  notes: '',
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

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
    paymentAmount1: sale.paymentAmount1 || sale.amount,
    paymentFee1: sale.paymentFee1,
    paymentMethod2: sale.paymentMethod2,
    paymentAmount2: sale.paymentAmount2,
    paymentFee2: sale.paymentFee2,
    dueDate: sale.dueDate || addDaysInputValue(sale.soldAt, 30),
    description: sale.description,
    soldAt: sale.soldAt,
  }
}

type SaleFormFieldsProps = {
  initial: SaleInput
  isEdit: boolean
  clients: Client[]
  sellerOptions: { value: string; label: string }[]
  products: InventoryItem[]
  onSubmit: (input: SaleInput) => Promise<void>
  onCreateClient: (input: ClientInput) => Promise<string>
}

type FiscalAfterSaleModalProps = {
  open: boolean
  busy: boolean
  onEmitNfe: () => void
  onEmitNfce: () => void
  onSkip: () => void
}

function FiscalAfterSaleModal({
  open,
  busy,
  onEmitNfe,
  onEmitNfce,
  onSkip,
}: FiscalAfterSaleModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-lg">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          Venda salva
        </h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Deseja emitir o documento fiscal agora? Se faltar configuracao fiscal, a venda permanece salva e a emissao fica pendente.
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={onEmitNfce}
          >
            Emitir NFC-e
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={onEmitNfe}
          >
            Emitir NF-e
          </Button>
          <Button type="button" variant="ghost" disabled={busy} onClick={onSkip}>
            Nao emitir agora
          </Button>
        </div>
        {busy ? (
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            Processando emissao fiscal...
          </p>
        ) : null}
      </div>
    </div>
  )
}

function matchesClientSearch(client: Client, rawSearch: string): boolean {
  const search = rawSearch.trim().toLowerCase()
  if (!search) return true

  const digits = onlyDigits(rawSearch)
  const textHaystack = [
    client.name,
    client.email,
    client.phone,
    client.document,
    client.address,
    client.addressNumber,
    client.district,
    client.city,
    client.state,
    client.zipCode,
    client.notes,
  ]
    .join(' ')
    .toLowerCase()

  const digitHaystack = [
    client.phone,
    client.document,
    client.zipCode,
  ]
    .map(onlyDigits)
    .join(' ')

  return textHaystack.includes(search) || Boolean(digits && digitHaystack.includes(digits))
}

type QuickClientFormProps = {
  initialSearch: string
  busy: boolean
  onCancel: () => void
  onSubmit: (input: ClientInput) => Promise<void>
}

function QuickClientForm({
  initialSearch,
  busy,
  onCancel,
  onSubmit,
}: QuickClientFormProps) {
  const initialDigits = onlyDigits(initialSearch)
  const looksLikePhone = initialDigits.length >= 8 && initialDigits.length <= 11
  const looksLikeDocument = initialDigits.length === 11 || initialDigits.length === 14
  const [form, setForm] = useState<ClientInput>(() => ({
    ...EMPTY_CLIENT_FORM,
    name: initialDigits && initialDigits === initialSearch.trim() ? '' : initialSearch.trim(),
    phone: looksLikePhone && !looksLikeDocument ? initialDigits : '',
    document: looksLikeDocument ? initialDigits : '',
  }))
  const isCompany = onlyDigits(form.document).length > 11

  return (
    <div className="mt-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Input
          label="Nome"
          name="quickClientName"
          value={form.name}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, name: event.target.value }))
          }
          required
        />
        <Input
          label="Telefone"
          name="quickClientPhone"
          value={form.phone}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, phone: onlyDigits(event.target.value) }))
          }
        />
        <Input
          label="CPF/CNPJ"
          name="quickClientDocument"
          value={form.document}
          maxLength={14}
          onChange={(event) => {
            const document = onlyDigits(event.target.value)
            setForm((prev) => ({
              ...prev,
              document,
              stateRegistrationIndicator: document.length === 11 ? '9' : prev.stateRegistrationIndicator,
              stateRegistration: document.length === 11 ? '' : prev.stateRegistration,
            }))
          }}
        />
        <Input
          label="E-mail"
          name="quickClientEmail"
          type="email"
          value={form.email}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, email: event.target.value }))
          }
        />
      </div>

      {isCompany ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Select
            label="Indicador IE"
            name="quickClientIeIndicator"
            value={form.stateRegistrationIndicator}
            options={[
              { value: '9', label: 'Nao contribuinte' },
              { value: '1', label: 'Contribuinte' },
              { value: '2', label: 'Isento' },
            ]}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                stateRegistrationIndicator: event.target.value as ClientInput['stateRegistrationIndicator'],
                stateRegistration:
                  event.target.value === '1' ? prev.stateRegistration : '',
              }))
            }
          />
          {form.stateRegistrationIndicator === '1' ? (
            <Input
              label="Inscricao estadual"
              name="quickClientIe"
              value={form.stateRegistration}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, stateRegistration: event.target.value }))
              }
            />
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_120px]">
        <Input
          label="Endereco fiscal"
          name="quickClientAddress"
          value={form.address}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, address: event.target.value }))
          }
        />
        <Input
          label="Numero"
          name="quickClientAddressNumber"
          value={form.addressNumber}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, addressNumber: event.target.value }))
          }
        />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <Input
          label="Bairro"
          name="quickClientDistrict"
          value={form.district}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, district: event.target.value }))
          }
        />
        <Input
          label="Municipio"
          name="quickClientCity"
          value={form.city}
          className="md:col-span-2"
          onChange={(event) =>
            setForm((prev) => ({ ...prev, city: event.target.value }))
          }
        />
        <Input
          label="UF"
          name="quickClientState"
          value={form.state}
          maxLength={2}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, state: event.target.value.toUpperCase() }))
          }
        />
      </div>
      <div className="mt-3">
        <Input
          label="CEP"
          name="quickClientZipCode"
          value={form.zipCode}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, zipCode: event.target.value }))
          }
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={busy || !form.name.trim()}
          onClick={() => {
            void onSubmit(form)
          }}
        >
          {busy ? 'Criando...' : 'Criar e selecionar'}
        </Button>
        <Button type="button" variant="secondary" disabled={busy} onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  )
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
  clients,
  sellerOptions,
  products,
  onSubmit,
  onCreateClient,
}: SaleFormFieldsProps) {
  const [form, setForm] = useState(initial)
  const [submitting, setSubmitting] = useState(false)
  const [creatingClient, setCreatingClient] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [showQuickClientForm, setShowQuickClientForm] = useState(false)
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

  const filteredClientOptions = useMemo(() => {
    const filteredClients = clients.filter((client) =>
      matchesClientSearch(client, clientSearch),
    )
    return filteredClients.slice(0, 80).map((client) => ({
      value: client.id,
      label: [client.name, client.phone, client.document, client.address]
        .filter(Boolean)
        .join(' - '),
    }))
  }, [clients, clientSearch])

  const selectedProduct = useMemo(
    () => products.find((item) => item.id === form.productId) ?? null,
    [products, form.productId],
  )

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === form.clientId) ?? null,
    [clients, form.clientId],
  )

  const availableStock = useMemo(() => {
    if (!selectedProduct) return null
    if (isEdit && initial.productId === form.productId) {
      return selectedProduct.quantity + initial.quantity
    }
    return selectedProduct.quantity
  }, [selectedProduct, isEdit, initial.productId, initial.quantity, form.productId])

  const total = computeSaleAmount(form)
  const paymentBalance = form.paymentMethod2
    ? total - form.paymentAmount1 - form.paymentAmount2
    : 0

  const fiscalReadinessIssues = useMemo(() => {
    const issues: string[] = []

    if (selectedClient) {
      const documentDigits = onlyDigits(selectedClient.document)
      const cepDigits = onlyDigits(selectedClient.zipCode)
      if (!selectedClient.document) issues.push('cliente sem CPF/CNPJ')
      else if (documentDigits.length !== 11 && documentDigits.length !== 14) {
        issues.push('CPF/CNPJ do cliente invalido')
      }
      if (
        !selectedClient.address ||
        !selectedClient.addressNumber ||
        !selectedClient.district ||
        !selectedClient.city ||
        !selectedClient.state ||
        !selectedClient.zipCode
      ) {
        issues.push('endereco fiscal do cliente incompleto')
      }
      if (selectedClient.state && selectedClient.state.trim().length !== 2) {
        issues.push('UF do cliente invalida')
      }
      if (selectedClient.zipCode && cepDigits.length !== 8) {
        issues.push('CEP do cliente invalido')
      }
      if (
        selectedClient.stateRegistrationIndicator === '1' &&
        !selectedClient.stateRegistration
      ) {
        issues.push('IE obrigatoria para cliente contribuinte')
      }
    }

    if (selectedProduct) {
      if (!selectedProduct.unit) issues.push('produto sem unidade fiscal')
      if (!selectedProduct.ncm) issues.push('produto sem NCM')
      else if (onlyDigits(selectedProduct.ncm).length !== 8) {
        issues.push('NCM do produto invalido')
      }
      if (!selectedProduct.cfop) issues.push('produto sem CFOP')
      else if (onlyDigits(selectedProduct.cfop).length !== 4) {
        issues.push('CFOP do produto invalido')
      }
      if (!/^[0-8]$/.test(selectedProduct.icmsOrigin)) {
        issues.push('origem ICMS do produto invalida')
      }
      if (!/^\d{2,3}$/.test(selectedProduct.icmsSituation)) {
        issues.push('CST/CSOSN ICMS do produto invalido')
      }
      if (!/^\d{2}$/.test(selectedProduct.pisSituation)) {
        issues.push('CST PIS do produto invalido')
      }
      if (!/^\d{2}$/.test(selectedProduct.cofinsSituation)) {
        issues.push('CST COFINS do produto invalido')
      }
    }

    return issues
  }, [selectedClient, selectedProduct])

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
      if (!form.clientId) {
        setError('Selecione um cliente.')
        return
      }
      if (!form.sellerId) {
        setError('Selecione um vendedor.')
        return
      }
      if (!form.productId) {
        setError('Selecione um produto.')
        return
      }
      if (form.quantity <= 0) {
        setError('Informe uma quantidade maior que zero.')
        return
      }
      if (form.unitPrice <= 0) {
        setError('Informe um valor unitario maior que zero.')
        return
      }
      if (availableStock !== null && form.quantity > availableStock) {
        setError('Quantidade maior que o estoque disponivel.')
        return
      }
      if (form.paymentMethod2) {
        if (form.paymentAmount1 <= 0 || form.paymentAmount2 <= 0) {
          setError('Informe valores maiores que zero para os dois pagamentos.')
          return
        }
        if (Math.abs(paymentBalance) > 0.01) {
          setError('Os pagamentos divididos precisam fechar o total da venda.')
          return
        }
      }

      await onSubmit({
        ...form,
        paymentAmount1: form.paymentMethod2 ? form.paymentAmount1 : total,
        paymentAmount2: form.paymentMethod2 ? form.paymentAmount2 : 0,
        paymentFee1: 0,
        paymentFee2: 0,
      })
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Não foi possível salvar a venda.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateClient(input: ClientInput) {
    setCreatingClient(true)
    setError(null)
    try {
      const clientId = await onCreateClient(input)
      setForm((prev) => ({ ...prev, clientId }))
      setClientSearch(input.name || input.phone || input.document)
      setShowQuickClientForm(false)
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Nao foi possivel criar o cliente.')
    } finally {
      setCreatingClient(false)
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
        <div className="mb-3">
          <Input
            label="Buscar cliente"
            name="clientSearch"
            value={clientSearch}
            placeholder="Nome, CPF/CNPJ, celular, email, endereco..."
            hint={`${filteredClientOptions.length} cliente(s) encontrado(s).`}
            onChange={(event) => setClientSearch(event.target.value)}
          />
        </div>
        <Select
          label="Cliente"
          name="clientId"
          value={form.clientId}
          placeholder="Selecione…"
          options={filteredClientOptions}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, clientId: event.target.value }))
          }
          required
        />
        {clientSearch.trim() && filteredClientOptions.length === 0 ? (
          <div className="mt-3">
            <Alert tone="warning">
              Nenhum cliente encontrado para essa busca. Cadastre agora para continuar a venda.
            </Alert>
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowQuickClientForm((value) => !value)}
          >
            {showQuickClientForm ? 'Fechar cadastro rapido' : 'Novo cliente'}
          </Button>
          {clientSearch ? (
            <Button type="button" variant="ghost" onClick={() => setClientSearch('')}>
              Limpar busca
            </Button>
          ) : null}
        </div>
        {showQuickClientForm ? (
          <QuickClientForm
            initialSearch={clientSearch}
            busy={creatingClient}
            onCancel={() => setShowQuickClientForm(false)}
            onSubmit={handleCreateClient}
          />
        ) : null}
      </div>

      {form.clientId ? <ClientInsightPanel clientId={form.clientId} /> : null}

      {fiscalReadinessIssues.length > 0 ? (
        <Alert tone="warning">
          Dados fiscais pendentes: {fiscalReadinessIssues.join(', ')}.
          {selectedClient ? (
            <>
              {' '}
              <Link className="font-medium underline" to={`/clientes/${selectedClient.id}`}>
                Revisar cliente
              </Link>
            </>
          ) : null}
          {selectedProduct ? (
            <>
              {' '}
              <Link className="font-medium underline" to={`/estoque/${selectedProduct.id}`}>
                Revisar produto
              </Link>
            </>
          ) : null}
        </Alert>
      ) : null}

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
              unitPrice: product?.defaultUnitPrice || prev.unitPrice || 0,
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

        <section className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-[var(--color-text)]">
                Pagamento
              </h2>
              <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
                Escolha uma forma ou divida o total em duas.
              </p>
            </div>
            <Button
              type="button"
              variant={form.paymentMethod2 ? 'secondary' : 'ghost'}
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  paymentMethod2: prev.paymentMethod2 ? '' : 'dinheiro',
                  paymentAmount1: prev.paymentMethod2
                    ? total
                    : prev.paymentAmount1 || total,
                  paymentAmount2: 0,
                  paymentFee1: 0,
                  paymentFee2: 0,
                }))
              }
            >
              {form.paymentMethod2 ? 'Remover divisao' : 'Dividir pagamento'}
            </Button>
          </div>

          {!form.paymentMethod2 ? (
            <Select
              label="Forma de pagamento"
              name="paymentMethod1"
              value={form.paymentMethod1}
              placeholder="Selecione..."
              options={PAYMENT_OPTIONS}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  paymentMethod1: event.target.value as PaymentMethod,
                  paymentAmount1: total,
                  paymentAmount2: 0,
                }))
              }
              required
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Primeiro pagamento"
                name="paymentMethod1"
                value={form.paymentMethod1}
                placeholder="Selecione..."
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
                label="Valor recebido (R$)"
                name="paymentAmount1"
                type="number"
                min="0"
                step="0.01"
                value={form.paymentAmount1 || ''}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    paymentAmount1: Number.parseFloat(event.target.value) || 0,
                  }))
                }
              />
              <Select
                label="Segundo pagamento"
                name="paymentMethod2"
                value={form.paymentMethod2}
                placeholder="Selecione..."
                options={PAYMENT_OPTIONS}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    paymentMethod2: event.target.value as PaymentMethod,
                  }))
                }
                required
              />
              <Input
                label="Valor recebido (R$)"
                name="paymentAmount2"
                type="number"
                min="0"
                step="0.01"
                value={form.paymentAmount2 || ''}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    paymentAmount2: Number.parseFloat(event.target.value) || 0,
                  }))
                }
              />
              <div className="sm:col-span-2">
                <Alert tone={Math.abs(paymentBalance) <= 0.01 ? 'success' : 'warning'}>
                  {Math.abs(paymentBalance) <= 0.01
                    ? 'Pagamentos fecham o total da venda.'
                    : `Diferenca: ${formatCurrency(paymentBalance)}.`}
                </Alert>
              </div>
            </div>
          )}
        </section>
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
  const { create, update, emitFiscalDocument } = useSaleMutations()
  const { sale, loading: saleLoading, error: saleError } = useSale(id)
  const { clients, loading: clientsLoading, create: createClient } = useClients()
  const { sellers, loading: sellersLoading } = useSellers()
  const { items: products, loading: productsLoading } = useInventory()
  const [savedSaleId, setSavedSaleId] = useState<string | null>(null)
  const [fiscalBusy, setFiscalBusy] = useState(false)

  function goToSavedSale(message: string) {
    if (!savedSaleId) return
    void navigate(`/vendas/${savedSaleId}`, { state: { message } })
  }

  async function emitAfterSave(documentType: 'nfe' | 'nfce') {
    if (!savedSaleId) return
    setFiscalBusy(true)
    try {
      const result = await emitFiscalDocument(savedSaleId, documentType)
      const label = documentType === 'nfce' ? 'NFC-e' : 'NF-e'
      if (!result.accepted || result.status === 'rejected' || result.status === 'error') {
        goToSavedSale(
          `Venda salva. ${label} nao emitida: ${result.message}`,
        )
        return
      }
      goToSavedSale(
        result.status === 'authorized'
          ? `Venda salva e ${label} autorizada.`
          : `Venda salva e ${label} enviada para processamento.`,
      )
    } catch (err) {
      const message =
        err instanceof AppError
          ? `Venda salva. Emissao fiscal pendente: ${err.message}`
          : 'Venda salva. Nao foi possivel emitir o documento fiscal agora.'
      goToSavedSale(message)
    } finally {
      setFiscalBusy(false)
    }
  }

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

  void clientOptions

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

      {sellers.length === 0 ? (
        <div className="mb-4">
          <Alert tone="warning">
            Cadastre ao menos um vendedor antes de registrar a venda.
          </Alert>
          <div className="mt-2">
            <Link to="/vendedores/novo">
              <Button variant="secondary">Novo vendedor</Button>
            </Link>
          </div>
        </div>
      ) : null}

      <SaleFormFields
        key={sale?.id ?? 'new-sale'}
        initial={toForm(sale)}
        isEdit={isEdit}
        clients={clients}
        sellerOptions={sellerOptions}
        products={products}
        onCreateClient={createClient}
        onSubmit={async (input) => {
          if (isEdit && id) {
            await update(id, input)
            void navigate(`/vendas/${id}`)
          } else {
            const createdId = await create(input)
            setSavedSaleId(createdId)
          }
        }}
      />
      <FiscalAfterSaleModal
        open={Boolean(savedSaleId)}
        busy={fiscalBusy}
        onEmitNfce={() => {
          void emitAfterSave('nfce')
        }}
        onEmitNfe={() => {
          void emitAfterSave('nfe')
        }}
        onSkip={() => goToSavedSale('Venda salva. Documento fiscal nao emitido.')}
      />
    </div>
  )
}
