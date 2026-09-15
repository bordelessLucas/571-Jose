import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Client, ClientInput } from '@/domain/types'
import { AppError } from '@/lib/errors'
import { useClient, useClientMutations } from '@/hooks/useClients'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { Input } from '@/presentation/components/ui/Input'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Spinner } from '@/presentation/components/ui/Spinner'
import { TextArea } from '@/presentation/components/ui/TextArea'

const EMPTY_FORM: ClientInput = {
  name: '',
  email: '',
  phone: '',
  document: '',
  notes: '',
}

function toForm(client: Client | null): ClientInput {
  if (!client) return EMPTY_FORM
  return {
    name: client.name,
    email: client.email,
    phone: client.phone,
    document: client.document,
    notes: client.notes,
  }
}

type ClientFormFieldsProps = {
  initial: ClientInput
  isEdit: boolean
  onSubmit: (input: ClientInput) => Promise<void>
}

function ClientFormFields({ initial, isEdit, onSubmit }: ClientFormFieldsProps) {
  const [form, setForm] = useState(initial)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      <Input
        label="Documento"
        name="document"
        value={form.document}
        onChange={(event) =>
          setForm((prev) => ({ ...prev, document: event.target.value }))
        }
      />
      <TextArea
        label="Observações"
        name="notes"
        value={form.notes}
        onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
      />
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Salvar'}
      </Button>
    </form>
  )
}

export function ClientFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { create, update } = useClientMutations()
  const { client, loading, error: loadError } = useClient(id)

  if (isEdit && loading) {
    return <Spinner />
  }

  if (isEdit && !client) {
    return <Alert tone="danger">{loadError ?? 'Cliente não encontrado.'}</Alert>
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={isEdit ? 'Editar cliente' : 'Novo cliente'}
        description="Informe os dados básicos e de contato."
        backTo="/clientes"
      />

      <ClientFormFields
        key={client?.id ?? 'new-client'}
        initial={toForm(client)}
        isEdit={isEdit}
        onSubmit={async (input) => {
          if (isEdit && id) {
            await update(id, input)
          } else {
            await create(input)
          }
          void navigate('/clientes')
        }}
      />
    </div>
  )
}
