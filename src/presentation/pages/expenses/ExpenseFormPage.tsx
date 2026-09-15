import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Expense, ExpenseCategory, ExpenseInput } from '@/domain/types'
import { EXPENSE_CATEGORY_LABELS } from '@/domain/types'
import { AppError } from '@/lib/errors'
import { todayInputValue } from '@/lib/format'
import { useExpense, useExpenseMutations } from '@/hooks/useExpenses'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { Input } from '@/presentation/components/ui/Input'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Select } from '@/presentation/components/ui/Select'
import { Spinner } from '@/presentation/components/ui/Spinner'
import { TextArea } from '@/presentation/components/ui/TextArea'

const EMPTY_FORM: ExpenseInput = {
  description: '',
  category: 'operacional',
  amount: 0,
  expenseDate: todayInputValue(),
}

const CATEGORY_OPTIONS = (
  Object.entries(EXPENSE_CATEGORY_LABELS) as [ExpenseCategory, string][]
).map(([value, label]) => ({ value, label }))

function toForm(expense: Expense | null): ExpenseInput {
  if (!expense) return EMPTY_FORM
  return {
    description: expense.description,
    category: expense.category,
    amount: expense.amount,
    expenseDate: expense.expenseDate,
  }
}

type ExpenseFormFieldsProps = {
  initial: ExpenseInput
  isEdit: boolean
  onSubmit: (input: ExpenseInput) => Promise<void>
}

function ExpenseFormFields({ initial, isEdit, onSubmit }: ExpenseFormFieldsProps) {
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
      <Select
        label="Categoria"
        name="category"
        value={form.category}
        options={CATEGORY_OPTIONS}
        onChange={(event) =>
          setForm((prev) => ({
            ...prev,
            category: event.target.value as ExpenseCategory,
          }))
        }
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
        name="expenseDate"
        type="date"
        value={form.expenseDate}
        onChange={(event) =>
          setForm((prev) => ({ ...prev, expenseDate: event.target.value }))
        }
        required
      />
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Salvar'}
      </Button>
    </form>
  )
}

export function ExpenseFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { create, update } = useExpenseMutations()
  const { expense, loading, error: loadError } = useExpense(id)

  if (isEdit && loading) {
    return <Spinner />
  }

  if (isEdit && !expense) {
    return <Alert tone="danger">{loadError ?? 'Despesa não encontrada.'}</Alert>
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={isEdit ? 'Editar despesa' : 'Nova despesa'}
        description="Registre descrição, categoria, valor e data."
        backTo="/despesas"
      />

      <ExpenseFormFields
        key={expense?.id ?? 'new-expense'}
        initial={toForm(expense)}
        isEdit={isEdit}
        onSubmit={async (input) => {
          if (isEdit && id) {
            await update(id, input)
          } else {
            await create(input)
          }
          void navigate('/despesas')
        }}
      />
    </div>
  )
}
