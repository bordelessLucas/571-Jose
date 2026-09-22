import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Client, ClientInput } from '@/domain/types'
import { AppError } from '@/lib/errors'
import { useClient, useClientMutations } from '@/hooks/useClients'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { Input } from '@/presentation/components/ui/Input'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Select } from '@/presentation/components/ui/Select'
import { Spinner } from '@/presentation/components/ui/Spinner'
import { TextArea } from '@/presentation/components/ui/TextArea'

const EMPTY_FORM: ClientInput = {
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

function toForm(client: Client | null): ClientInput {
  if (!client) return EMPTY_FORM
  return {
    name: client.name,
    email: client.email,
    phone: client.phone,
    address: client.address,
    addressNumber: client.addressNumber,
    district: client.district,
    city: client.city,
    state: client.state,
    zipCode: client.zipCode,
    document: client.document,
    stateRegistration: client.stateRegistration,
    stateRegistrationIndicator: client.stateRegistrationIndicator,
    notes: client.notes,
  }
}

type ViaCepResponse = {
  erro?: boolean
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function formatCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function documentKind(document: string): 'cpf' | 'cnpj' {
  return onlyDigits(document).length > 11 ? 'cnpj' : 'cpf'
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
  const [cepStatus, setCepStatus] = useState<'idle' | 'loading' | 'found' | 'not_found' | 'error'>('idle')
  const lastCepLookup = useRef('')
  const currentDocumentKind = documentKind(form.document)
  useUnsavedChanges(!submitting && JSON.stringify(form) !== JSON.stringify(initial))

  useEffect(() => {
    const cep = onlyDigits(form.zipCode)

    if (cep.length !== 8) {
      lastCepLookup.current = ''
      setCepStatus('idle')
      return
    }

    if (lastCepLookup.current === cep) return
    lastCepLookup.current = cep
    setCepStatus('loading')

    const controller = new AbortController()

    fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('CEP indisponivel')
        return (await response.json()) as ViaCepResponse
      })
      .then((data) => {
        if (data.erro) {
          setCepStatus('not_found')
          return
        }

        setForm((prev) => ({
          ...prev,
          address: prev.address || data.logradouro || '',
          district: prev.district || data.bairro || '',
          city: prev.city || data.localidade || '',
          state: prev.state || data.uf || '',
        }))
        setCepStatus('found')
      })
      .catch((fetchError) => {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          return
        }
        setCepStatus('error')
      })

    return () => controller.abort()
  }, [form.zipCode])

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
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label="Tipo de cliente"
          name="documentKind"
          value={currentDocumentKind}
          options={[
            { value: 'cpf', label: 'Pessoa fisica (CPF)' },
            { value: 'cnpj', label: 'Empresa (CNPJ)' },
          ]}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              document: '',
              stateRegistration: '',
              stateRegistrationIndicator:
                event.target.value === 'cpf' ? '9' : prev.stateRegistrationIndicator,
            }))
          }
        />
        <Input
          label={currentDocumentKind === 'cpf' ? 'CPF' : 'CNPJ'}
          name="document"
          value={form.document}
          maxLength={14}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, document: onlyDigits(event.target.value) }))
          }
        />
      </div>
      {currentDocumentKind === 'cnpj' ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="Indicador IE"
            name="stateRegistrationIndicator"
            value={form.stateRegistrationIndicator}
            options={[
              { value: '9', label: 'Nao contribuinte' },
              { value: '1', label: 'Contribuinte' },
              { value: '2', label: 'Isento' },
            ]}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                stateRegistrationIndicator: event.target
                  .value as ClientInput['stateRegistrationIndicator'],
                stateRegistration:
                  event.target.value === '1' ? prev.stateRegistration : '',
              }))
            }
          />
          {form.stateRegistrationIndicator === '1' ? (
            <Input
              label="Inscricao estadual"
              name="stateRegistration"
              value={form.stateRegistration}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, stateRegistration: event.target.value }))
              }
              required
            />
          ) : null}
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
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
          type="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, phone: onlyDigits(event.target.value) }))
          }
        />
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_140px]">
        <Input
          label="Endereco fiscal"
          name="address"
          autoComplete="street-address"
          value={form.address}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, address: event.target.value }))
          }
        />
        <Input
          label="Numero"
          name="addressNumber"
          value={form.addressNumber}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, addressNumber: event.target.value }))
          }
        />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Input
          label="Bairro"
          name="district"
          value={form.district}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, district: event.target.value }))
          }
        />
        <Input
          label="Municipio"
          name="city"
          value={form.city}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, city: event.target.value }))
          }
          className="md:col-span-2"
        />
        <Input
          label="UF"
          name="state"
          maxLength={2}
          value={form.state}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, state: event.target.value.toUpperCase() }))
          }
        />
      </div>
      <Input
        label="CEP"
        name="zipCode"
        maxLength={9}
        value={form.zipCode}
        hint={
          cepStatus === 'loading'
            ? 'Buscando endereco...'
            : cepStatus === 'found'
              ? 'Endereco localizado pelo CEP.'
              : cepStatus === 'not_found'
                ? 'CEP nao encontrado. Preencha manualmente.'
                : cepStatus === 'error'
                  ? 'Nao foi possivel consultar o CEP agora.'
                  : 'Digite 8 numeros para buscar endereco.'
        }
        onChange={(event) =>
          setForm((prev) => ({ ...prev, zipCode: formatCep(event.target.value) }))
        }
      />
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
    return <Alert tone="danger">{loadError ?? 'Cliente nao encontrado.'}</Alert>
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={isEdit ? 'Editar cliente' : 'Novo cliente'}
        description="Informe os dados de contato e fiscais."
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
