import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Sale, SaleInput } from '@/domain/types'
import { AppError } from '@/lib/errors'
import { todayInputValue } from '@/lib/format'
import { useClients } from '@/hooks/useClients'
import { useSale, useSaleMutations } from '@/hooks/useSales'
import { useSellers } from '@/hooks/useSellers'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { Input } from '@/presentation/components/ui/Input'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Select } from '@/presentation/components/ui/Select'
import { Spinner } from '@/presentation/components/ui/Spinner'
import { TextArea } from '@/presentation/components/ui/TextArea'

const EMPTY_FORM: SaleInput = {
  clientId: '',
  sellerId: '',
  amount: 0,
  description: '',
  soldAt: todayInputValue(),
}

function toForm(sale: Sale | null): SaleInput {
  if (!sale) return EMPTY_FORM
  return {
    clientId: sale.clientId,
    sellerId: sale.sellerId,
    amount: sale.amount,
    description: sale.description,
    soldAt: sale.soldAt,
  }
}

type SaleFormFieldsProps = {
  initial: SaleInput
  isEdit: boolean
  clientOptions: { value: string; label: string }[]
  sellerOptions: { value: string; label: string }[]
  onSubmit: (input: SaleInput) => Promise<void>
}

function SaleFormFields({
  initial,
  isEdit,
  clientOptions,
  sellerOptions,
  onSubmit,
}: SaleFormFieldsProps) {
  const [form, setForm] = useState(initial)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredSellers = useMemo(
    () =>
      sellerOptions.filter(
        (option) =>
          !option.label.includes('(inativo)') || option.value === form.sellerId,
      ),
    [sellerOptions, form.sellerId],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await onSubmit(form)
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
      className="mt-4 flex flex-col gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}
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
      <Input
        label="Valor (R$)"
        name="amount"
        type="number"
        min="0.01"
        step="0.01"
        value={form.amount || ''}
        onChange={(event) =>
          setForm((prev) => ({
            ...prev,
            amount: Number.parseFloat(event.target.value) || 0,
          }))
        }
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
      <TextArea
        label="Descrição / observações"
        name="description"
        value={form.description}
        onChange={(event) =>
          setForm((prev) => ({ ...prev, description: event.target.value }))
        }
      />
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Salvar venda'}
      </Button>
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

  if ((isEdit && saleLoading) || clientsLoading || sellersLoading) {
    return <Spinner />
  }

  if (isEdit && !sale) {
    return <Alert tone="danger">{saleError ?? 'Venda não encontrada.'}</Alert>
  }

  const clientOptions = clients.map((client) => ({
    value: client.id,
    label: client.name,
  }))

  const sellerOptions = sellers.map((seller) => ({
    value: seller.id,
    label: seller.active ? seller.name : `${seller.name} (inativo)`,
  }))

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={isEdit ? 'Editar venda' : 'Nova venda'}
        description="Selecione cliente e vendedor e informe o valor."
        actions={
          <Link to="/vendas">
            <Button variant="secondary">Voltar</Button>
          </Link>
        }
      />

      <SaleFormFields
        key={sale?.id ?? 'new-sale'}
        initial={toForm(sale)}
        isEdit={isEdit}
        clientOptions={clientOptions}
        sellerOptions={sellerOptions}
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
