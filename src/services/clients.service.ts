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
    throw new AppError('validation', 'Nome do cliente é obrigatório.')
  }
}

function mapClient(id: string, data: Record<string, unknown>): Client {
  return {
    id,
    name: requireString(data, 'name'),
    email: requireString(data, 'email'),
    phone: requireString(data, 'phone'),
    address: requireString(data, 'address'),
    document: requireString(data, 'document'),
    notes: requireString(data, 'notes'),
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  }
}

export async function listClients(): Promise<Client[]> {
  try {
    const snapshot = await getDocs(query(collection(db, COLLECTION), orderBy('name')))
    return snapshot.docs.map((item) => mapClient(mapDocId(item), item.data()))
  } catch (error) {
    throw toAppError(error, 'Não foi possível carregar os clientes.')
  }
}

export async function getClientById(id: string): Promise<Client> {
  try {
    const snapshot = await getDoc(doc(db, COLLECTION, id))
    if (!snapshot.exists()) {
      throw new AppError('not_found', 'Cliente não encontrado.')
    }
    return mapClient(snapshot.id, snapshot.data())
  } catch (error) {
    throw toAppError(error, 'Não foi possível carregar o cliente.')
  }
}

export async function createClient(input: ClientInput): Promise<string> {
  validateInput(input)

  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      address: input.address.trim(),
      document: input.document.trim(),
      notes: input.notes.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  } catch (error) {
    throw toAppError(error, 'Não foi possível criar o cliente.')
  }
}

export async function updateClient(id: string, input: ClientInput): Promise<void> {
  validateInput(input)

  try {
    await updateDoc(doc(db, COLLECTION, id), {
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      address: input.address.trim(),
      document: input.document.trim(),
      notes: input.notes.trim(),
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw toAppError(error, 'Não foi possível atualizar o cliente.')
  }
}

export async function deleteClient(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, id))
  } catch (error) {
    throw toAppError(error, 'Não foi possível excluir o cliente.')
  }
}
