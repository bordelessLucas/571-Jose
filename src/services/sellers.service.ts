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
import type { Seller, SellerInput } from '@/domain/types'
import { AppError, toAppError } from '@/lib/errors'
import { db } from '@/services/firebase'
import {
  mapDocId,
  requireBoolean,
  requireString,
  toIsoString,
} from '@/services/firestore.mapper'

const COLLECTION = 'sellers'

function validateInput(input: SellerInput): void {
  if (!input.name.trim()) {
    throw new AppError('validation', 'Nome do vendedor é obrigatório.')
  }
}

function mapSeller(id: string, data: Record<string, unknown>): Seller {
  return {
    id,
    name: requireString(data, 'name'),
    email: requireString(data, 'email'),
    phone: requireString(data, 'phone'),
    active: requireBoolean(data, 'active', true),
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  }
}

export async function listSellers(): Promise<Seller[]> {
  try {
    const snapshot = await getDocs(query(collection(db, COLLECTION), orderBy('name')))
    return snapshot.docs.map((item) => mapSeller(mapDocId(item), item.data()))
  } catch (error) {
    throw toAppError(error, 'Não foi possível carregar os vendedores.')
  }
}

export async function getSellerById(id: string): Promise<Seller> {
  try {
    const snapshot = await getDoc(doc(db, COLLECTION, id))
    if (!snapshot.exists()) {
      throw new AppError('not_found', 'Vendedor não encontrado.')
    }
    return mapSeller(snapshot.id, snapshot.data())
  } catch (error) {
    throw toAppError(error, 'Não foi possível carregar o vendedor.')
  }
}

export async function createSeller(input: SellerInput): Promise<string> {
  validateInput(input)

  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      active: input.active,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  } catch (error) {
    throw toAppError(error, 'Não foi possível criar o vendedor.')
  }
}

export async function updateSeller(id: string, input: SellerInput): Promise<void> {
  validateInput(input)

  try {
    await updateDoc(doc(db, COLLECTION, id), {
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      active: input.active,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw toAppError(error, 'Não foi possível atualizar o vendedor.')
  }
}

export async function deleteSeller(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, id))
  } catch (error) {
    throw toAppError(error, 'Não foi possível excluir o vendedor.')
  }
}
