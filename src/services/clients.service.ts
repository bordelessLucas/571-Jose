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
  if (input.state.trim() && input.state.trim().length !== 2) {
    throw new AppError('validation', 'UF deve ter 2 letras.')
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
    document: input.document.trim(),
    stateRegistration: input.stateRegistration.trim(),
    stateRegistrationIndicator: input.stateRegistrationIndicator || '9',
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
