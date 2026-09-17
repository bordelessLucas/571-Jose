import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type {
  AccountReceivable,
  AccountReceivableInput,
  FinancialStatus,
} from '@/domain/types'
import { FINANCIAL_STATUS_LABELS } from '@/domain/types'
import { AppError } from '@/lib/errors'
import { todayInputValue } from '@/lib/format'
import {
  useAccountReceivable,
  useAccountReceivableMutations,
} from '@/hooks/useAccountsReceivable'
import { useClients } from '@/hooks/useClients'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { Input } from '@/presentation/components/ui/Input'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Select } from '@/presentation/components/ui/Select'
import { Spinner } from '@/presentation/components/ui/Spinner'
import { TextArea } from '@/presentation/components/ui/TextArea'

const EMPTY_FORM: AccountReceivableInput = {
  description: '',
  amount: 0,
  dueDate: todayInputValue(),
  status: 'pendente',
  clientId: '',
  clientName: '',
  saleId: null,
}

const STATUS_OPTIONS = (
  Object.entries(FINANCIAL_STATUS_LABELS) as [FinancialStatus, string][]
).map(([value, label]) => ({ value, label }))

function toForm(account: AccountReceivable | null): AccountReceivableInput {
  if (!account) return EMPTY_FORM
  return {
    description: account.description,
    amount: account.amount,
    dueDate: account.dueDate,
    status: account.status,
    clientId: account.clientId,
    clientName: account.clientName,
    saleId: account.saleId,
  }
}

type FormFieldsProps = {
  initial: AccountReceivableInput
  isEdit: boolean
  clientOptions: { value: string; label: string }[]
  onSubmit: (input: AccountReceivableInput) => Promise<void>
}

function FormFields({ initial, isEdit, clientOptions, onSubmit }: FormFieldsProps) {
  const [form, setForm] = useState(initial)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useUnsavedChanges(!submitting && JSON.stringify(form) !== JSON.stringify(initial))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const selected = clientOptions.find((option) => option.value === form.clientId)
      await onSubmit({
        ...form,
        clientName: selected?.label ?? form.clientName,
      })
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
      <Select
        label="Cliente (opcional)"
        name="clientId"
        value={form.clientId}
        placeholder="Sem cliente…"
        options={clientOptions}
        onChange={(event) =>
          setForm((prev) => ({ ...prev, clientId: event.target.value }))
        }
      />
      <TextArea
        label="Descrição"
        name="description"
        value={form.description}
        onChange={(event) =>
          setForm((prev) => ({ ...prev, description: event.target.value }))
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
        label="Vencimento"
        name="dueDate"
        type="date"
        value={form.dueDate}
        onChange={(event) =>
          setForm((prev) => ({ ...prev, dueDate: event.target.value }))
        }
        required
      />
      <Select
        label="Status"
        name="status"
        value={form.status}
        options={STATUS_OPTIONS}
        onChange={(event) =>
          setForm((prev) => ({
            ...prev,
            status: event.target.value as FinancialStatus,
          }))
        }
      />
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Salvar'}
      </Button>
    </form>
  )
}

export function AccountReceivableFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { create, update } = useAccountReceivableMutations()
  const { account, loading, error: loadError } = useAccountReceivable(id)
  const { clients, loading: clientsLoading } = useClients()

  if ((isEdit && loading) || clientsLoading) return <Spinner />
  if (isEdit && !account) {
    return <Alert tone="danger">{loadError ?? 'Conta não encontrada.'}</Alert>
  }

  const clientOptions = clients.map((client) => ({
    value: client.id,
    label: client.name,
  }))

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={isEdit ? 'Editar conta a receber' : 'Nova conta a receber'}
        description="Informe cliente (opcional), valor, vencimento e status."
        backTo="/financeiro/receber"
      />
      <FormFields
        key={account?.id ?? 'new-receivable'}
        initial={toForm(account)}
        isEdit={isEdit}
        clientOptions={clientOptions}
        onSubmit={async (input) => {
          if (isEdit && id) await update(id, input)
          else await create(input)
          void navigate('/financeiro/receber')
        }}
      />
    </div>
  )
}
