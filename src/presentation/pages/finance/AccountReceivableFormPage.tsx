import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
  }
}

type FormFieldsProps = {
  initial: AccountReceivableInput
  isEdit: boolean
  onSubmit: (input: AccountReceivableInput) => Promise<void>
}

function FormFields({ initial, isEdit, onSubmit }: FormFieldsProps) {
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

  if (isEdit && loading) return <Spinner />
  if (isEdit && !account) {
    return <Alert tone="danger">{loadError ?? 'Conta não encontrada.'}</Alert>
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={isEdit ? 'Editar conta a receber' : 'Nova conta a receber'}
        description="Informe valor, vencimento e status."
        actions={
          <Link to="/financeiro/receber">
            <Button variant="secondary">Voltar</Button>
          </Link>
        }
      />
      <FormFields
        key={account?.id ?? 'new-receivable'}
        initial={toForm(account)}
        isEdit={isEdit}
        onSubmit={async (input) => {
          if (isEdit && id) await update(id, input)
          else await create(input)
          void navigate('/financeiro/receber')
        }}
      />
    </div>
  )
}
