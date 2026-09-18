import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { InventoryItem, InventoryItemInput } from '@/domain/types'
import { AppError } from '@/lib/errors'
import { useInventoryItem, useInventoryMutations } from '@/hooks/useInventory'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { Input } from '@/presentation/components/ui/Input'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Select } from '@/presentation/components/ui/Select'
import { Spinner } from '@/presentation/components/ui/Spinner'
import { TextArea } from '@/presentation/components/ui/TextArea'

const EMPTY_FORM: InventoryItemInput = {
  name: '',
  sku: '',
  quantity: 0,
  unit: 'UN',
  ncm: '',
  cfop: '5102',
  icmsOrigin: '0',
  icmsSituation: '102',
  notes: '',
}

function toForm(item: InventoryItem | null): InventoryItemInput {
  if (!item) return EMPTY_FORM
  return {
    name: item.name,
    sku: item.sku,
    quantity: item.quantity,
    unit: item.unit,
    ncm: item.ncm,
    cfop: item.cfop,
    icmsOrigin: item.icmsOrigin,
    icmsSituation: item.icmsSituation,
    notes: item.notes,
  }
}

type FormFieldsProps = {
  initial: InventoryItemInput
  isEdit: boolean
  onSubmit: (input: InventoryItemInput) => Promise<void>
}

function FormFields({ initial, isEdit, onSubmit }: FormFieldsProps) {
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
      setError(err instanceof AppError ? err.message : 'Nao foi possivel salvar.')
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
      <div className="grid gap-4 md:grid-cols-3">
        <Input
          label="SKU / codigo"
          name="sku"
          value={form.sku}
          onChange={(event) => setForm((prev) => ({ ...prev, sku: event.target.value }))}
        />
        <Input
          label="Quantidade"
          name="quantity"
          type="number"
          min="0"
          step="1"
          value={form.quantity}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              quantity: Number.parseFloat(event.target.value) || 0,
            }))
          }
          required
        />
        <Input
          label="Unidade"
          name="unit"
          value={form.unit}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, unit: event.target.value.toUpperCase() }))
          }
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="NCM"
          name="ncm"
          value={form.ncm}
          onChange={(event) => setForm((prev) => ({ ...prev, ncm: event.target.value }))}
        />
        <Input
          label="CFOP"
          name="cfop"
          value={form.cfop}
          onChange={(event) => setForm((prev) => ({ ...prev, cfop: event.target.value }))}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label="Origem ICMS"
          name="icmsOrigin"
          value={form.icmsOrigin}
          options={[
            { value: '0', label: '0 - Nacional' },
            { value: '1', label: '1 - Estrangeira importacao direta' },
            { value: '2', label: '2 - Estrangeira mercado interno' },
          ]}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, icmsOrigin: event.target.value }))
          }
        />
        <Input
          label="CST/CSOSN ICMS"
          name="icmsSituation"
          value={form.icmsSituation}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, icmsSituation: event.target.value }))
          }
        />
      </div>
      <TextArea
        label="Observacoes"
        name="notes"
        value={form.notes}
        onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
      />
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Salvando...' : isEdit ? 'Salvar alteracoes' : 'Salvar'}
      </Button>
    </form>
  )
}

export function InventoryFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { create, update } = useInventoryMutations()
  const { item, loading, error: loadError } = useInventoryItem(id)

  if (isEdit && loading) return <Spinner />
  if (isEdit && !item) {
    return <Alert tone="danger">{loadError ?? 'Item nao encontrado.'}</Alert>
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={isEdit ? 'Editar item' : 'Novo item'}
        description="Cadastre estoque e dados fiscais do produto."
        backTo="/estoque"
      />
      <FormFields
        key={item?.id ?? 'new-item'}
        initial={toForm(item)}
        isEdit={isEdit}
        onSubmit={async (input) => {
          if (isEdit && id) await update(id, input)
          else await create(input)
          void navigate('/estoque')
        }}
      />
    </div>
  )
}
