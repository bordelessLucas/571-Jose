import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Seller, SellerInput } from '@/domain/types'
import { AppError } from '@/lib/errors'
import { useSeller, useSellerMutations } from '@/hooks/useSellers'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { Input } from '@/presentation/components/ui/Input'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Select } from '@/presentation/components/ui/Select'
import { Spinner } from '@/presentation/components/ui/Spinner'

const EMPTY_FORM: SellerInput = {
  name: '',
  email: '',
  phone: '',
  active: true,
}

function toForm(seller: Seller | null): SellerInput {
  if (!seller) return EMPTY_FORM
  return {
    name: seller.name,
    email: seller.email,
    phone: seller.phone,
    active: seller.active,
  }
}

type SellerFormFieldsProps = {
  initial: SellerInput
  isEdit: boolean
  onSubmit: (input: SellerInput) => Promise<void>
}

function SellerFormFields({ initial, isEdit, onSubmit }: SellerFormFieldsProps) {
  const [form, setForm] = useState(initial)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useUnsavedChanges(!submitting && JSON.stringify(form) !== JSON.stringify(initial))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await onSubmit(form)
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Não foi possível salvar.')
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
      <Input
        label="Nome"
        name="name"
        value={form.name}
        onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        required
      />
      <Input
        label="E-mail"
        name="email"
        type="email"
        value={form.email}
        onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
      />
      <Input
        label="Telefone"
        name="phone"
        value={form.phone}
        onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
      />
      <Select
        label="Status"
        name="active"
        value={form.active ? 'true' : 'false'}
        onChange={(event) =>
          setForm((prev) => ({ ...prev, active: event.target.value === 'true' }))
        }
        options={[
          { value: 'true', label: 'Ativo' },
          { value: 'false', label: 'Inativo' },
        ]}
      />
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Salvar'}
      </Button>
    </form>
  )
}

export function SellerFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { create, update } = useSellerMutations()
  const { seller, loading, error: loadError } = useSeller(id)

  if (isEdit && loading) {
    return <Spinner />
  }

  if (isEdit && !seller) {
    return <Alert tone="danger">{loadError ?? 'Vendedor não encontrado.'}</Alert>
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={isEdit ? 'Editar vendedor' : 'Novo vendedor'}
        description="Informe os dados do vendedor."
        backTo="/vendedores"
      />

      <SellerFormFields
        key={seller?.id ?? 'new-seller'}
        initial={toForm(seller)}
        isEdit={isEdit}
        onSubmit={async (input) => {
          if (isEdit && id) {
            await update(id, input)
          } else {
            await create(input)
          }
          void navigate('/vendedores')
        }}
      />
    </div>
  )
}
