import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import type { Client, ClientInput } from '@/domain/types'
import { AppError, toAppError } from '@/lib/errors'
import { db } from '@/services/firebase'
import {
  mapDocId,
  requireString,
  toIsoString,
} from '@/services/firestore.mapper'

const COLLECTION = 'clients'

function validateInput(input: ClientInput): void {
  if (!input.name.trim()) {
    throw new AppError('validation', 'Nome do cliente e obrigatorio.')
  }
  const document = onlyDigits(input.document)
  if (document && document.length !== 11 && document.length !== 14) {
    throw new AppError('validation', 'Documento deve ter 11 digitos (CPF) ou 14 digitos (CNPJ).')
  }
  if (input.state.trim() && input.state.trim().length !== 2) {
    throw new AppError('validation', 'UF deve ter 2 letras.')
  }
  const zipCode = onlyDigits(input.zipCode)
  if (zipCode && zipCode.length !== 8) {
    throw new AppError('validation', 'CEP deve ter 8 digitos.')
  }
  if (
    document.length === 14 &&
    input.stateRegistrationIndicator === '1' &&
    !input.stateRegistration.trim()
  ) {
    throw new AppError('validation', 'Inscricao estadual e obrigatoria para contribuinte.')
  }
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

async function assertNoDuplicateClient(input: ClientInput, ignoreId?: string): Promise<void> {
  const clients = await listClients()
  const document = onlyDigits(input.document)
  const phone = onlyDigits(input.phone)
  const name = normalizeName(input.name)

  const duplicate = clients.find((client) => {
    if (ignoreId && client.id === ignoreId) return false
    const clientDocument = onlyDigits(client.document)
    const clientPhone = onlyDigits(client.phone)
    const clientName = normalizeName(client.name)

    if (document && clientDocument && document === clientDocument) return true
    if (phone && clientPhone && phone === clientPhone) return true
    return Boolean(name && phone && clientName === name && clientPhone === phone)
  })

  if (duplicate) {
    throw new AppError(
      'validation',
      `Possivel cliente duplicado: ${duplicate.name}. Revise CPF/CNPJ ou telefone.`,
    )
  }
}

function mapClient(id: string, data: Record<string, unknown>): Client {
  return {
    id,
    name: requireString(data, 'name'),
    email: requireString(data, 'email'),
    phone: requireString(data, 'phone'),
    address: requireString(data, 'address'),
    addressNumber: requireString(data, 'addressNumber'),
    district: requireString(data, 'district'),
    city: requireString(data, 'city'),
    state: requireString(data, 'state'),
    zipCode: requireString(data, 'zipCode'),
    document: requireString(data, 'document'),
    stateRegistration: requireString(data, 'stateRegistration'),
    stateRegistrationIndicator:
      (requireString(data, 'stateRegistrationIndicator') as Client['stateRegistrationIndicator']) ||
      '9',
    notes: requireString(data, 'notes'),
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  }
}

function toClientPayload(input: ClientInput) {
  const document = onlyDigits(input.document)
  const isCpf = document.length === 11
  const stateRegistrationIndicator = isCpf
    ? '9'
    : input.stateRegistrationIndicator || '9'

  return {
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    address: input.address.trim(),
    addressNumber: input.addressNumber.trim(),
    district: input.district.trim(),
    city: input.city.trim(),
    state: input.state.trim().toUpperCase(),
    zipCode: input.zipCode.trim(),
    document,
    stateRegistration: stateRegistrationIndicator === '1' ? input.stateRegistration.trim() : '',
    stateRegistrationIndicator,
    notes: input.notes.trim(),
  }
}

export async function listClients(): Promise<Client[]> {
  try {
    const snapshot = await getDocs(query(collection(db, COLLECTION), orderBy('name')))
    return snapshot.docs.map((item) => mapClient(mapDocId(item), item.data()))
  } catch (error) {
    throw toAppError(error, 'Nao foi possivel carregar os clientes.')
  }
}

export async function getClientById(id: string): Promise<Client> {
  try {
    const snapshot = await getDoc(doc(db, COLLECTION, id))
    if (!snapshot.exists()) {
      throw new AppError('not_found', 'Cliente nao encontrado.')
    }
    return mapClient(snapshot.id, snapshot.data())
  } catch (error) {
    throw toAppError(error, 'Nao foi possivel carregar o cliente.')
  }
}

export async function createClient(input: ClientInput): Promise<string> {
  validateInput(input)
  await assertNoDuplicateClient(input)

  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      ...toClientPayload(input),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  } catch (error) {
    throw toAppError(error, 'Nao foi possivel criar o cliente.')
  }
}

export async function updateClient(id: string, input: ClientInput): Promise<void> {
  validateInput(input)
  await assertNoDuplicateClient(input, id)

  try {
    await updateDoc(doc(db, COLLECTION, id), {
      ...toClientPayload(input),
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw toAppError(error, 'Nao foi possivel atualizar o cliente.')
  }
}

export async function deleteClient(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, id))
  } catch (error) {
    throw toAppError(error, 'Nao foi possivel excluir o cliente.')
  }
}
