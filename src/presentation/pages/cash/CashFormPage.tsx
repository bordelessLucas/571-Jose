import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type {
  CashMovement,
  CashMovementInput,
  CashMovementType,
} from '@/domain/types'
import { CASH_MOVEMENT_TYPE_LABELS } from '@/domain/types'
import { AppError } from '@/lib/errors'
import { todayInputValue } from '@/lib/format'
import { useCashMovement, useCashMutations } from '@/hooks/useCash'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { Input } from '@/presentation/components/ui/Input'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Select } from '@/presentation/components/ui/Select'
import { Spinner } from '@/presentation/components/ui/Spinner'
import { TextArea } from '@/presentation/components/ui/TextArea'

const EMPTY_FORM: CashMovementInput = {
  type: 'entrada',
  description: '',
  amount: 0,
  movementDate: todayInputValue(),
}

const TYPE_OPTIONS = (
  Object.entries(CASH_MOVEMENT_TYPE_LABELS) as [CashMovementType, string][]
).map(([value, label]) => ({ value, label }))

function toForm(movement: CashMovement | null): CashMovementInput {
  if (!movement) return EMPTY_FORM
  return {
    type: movement.type,
    description: movement.description,
    amount: movement.amount,
    movementDate: movement.movementDate,
  }
}

type FormFieldsProps = {
  initial: CashMovementInput
  isEdit: boolean
  onSubmit: (input: CashMovementInput) => Promise<void>
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
      <Select
        label="Tipo"
        name="type"
        value={form.type}
        options={TYPE_OPTIONS}
        onChange={(event) =>
          setForm((prev) => ({
            ...prev,
            type: event.target.value as CashMovementType,
          }))
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
        label="Data"
        name="movementDate"
        type="date"
        value={form.movementDate}
        onChange={(event) =>
          setForm((prev) => ({ ...prev, movementDate: event.target.value }))
        }
        required
      />
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Salvar'}
      </Button>
    </form>
  )
}

export function CashFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { create, update } = useCashMutations()
  const { movement, loading, error: loadError } = useCashMovement(id)

  if (isEdit && loading) return <Spinner />
  if (isEdit && !movement) {
    return <Alert tone="danger">{loadError ?? 'Movimentação não encontrada.'}</Alert>
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={isEdit ? 'Editar movimentação' : 'Nova movimentação'}
        description="Registre entrada ou saída de caixa."
        backTo="/caixa"
      />
      <FormFields
        key={movement?.id ?? 'new-cash'}
        initial={toForm(movement)}
        isEdit={isEdit}
        onSubmit={async (input) => {
          if (isEdit && id) await update(id, input)
          else await create(input)
          void navigate('/caixa')
        }}
      />
    </div>
  )
}
