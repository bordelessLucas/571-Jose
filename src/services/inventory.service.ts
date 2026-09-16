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
import type { InventoryItem, InventoryItemInput } from '@/domain/types'
import { AppError, toAppError } from '@/lib/errors'
import { db } from '@/services/firebase'
import {
  mapDocId,
  requireNumber,
  requireString,
  toIsoString,
} from '@/services/firestore.mapper'

const COLLECTION = 'inventoryItems'

function validateInput(input: InventoryItemInput): void {
  if (!input.name.trim()) {
    throw new AppError('validation', 'Nome do item é obrigatório.')
  }
  if (input.quantity < 0 || !Number.isFinite(input.quantity)) {
    throw new AppError('validation', 'Quantidade inválida.')
  }
}

function mapItem(id: string, data: Record<string, unknown>): InventoryItem {
  return {
    id,
    name: requireString(data, 'name'),
    sku: requireString(data, 'sku'),
    quantity: requireNumber(data, 'quantity'),
    unit: requireString(data, 'unit') || 'un',
    notes: requireString(data, 'notes'),
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  }
}

export async function listInventoryItems(): Promise<InventoryItem[]> {
  try {
    const snapshot = await getDocs(
      query(collection(db, COLLECTION), orderBy('name')),
    )
    return snapshot.docs.map((item) => mapItem(mapDocId(item), item.data()))
  } catch (error) {
    throw toAppError(error, 'Não foi possível carregar o estoque.')
  }
}

export async function getInventoryItemById(id: string): Promise<InventoryItem> {
  try {
    const snapshot = await getDoc(doc(db, COLLECTION, id))
    if (!snapshot.exists()) {
      throw new AppError('not_found', 'Item de estoque não encontrado.')
    }
    return mapItem(snapshot.id, snapshot.data())
  } catch (error) {
    throw toAppError(error, 'Não foi possível carregar o item.')
  }
}

export async function createInventoryItem(
  input: InventoryItemInput,
): Promise<string> {
  validateInput(input)

  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      name: input.name.trim(),
      sku: input.sku.trim(),
      quantity: input.quantity,
      unit: input.unit.trim() || 'un',
      notes: input.notes.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  } catch (error) {
    throw toAppError(error, 'Não foi possível cadastrar o item.')
  }
}

export async function updateInventoryItem(
  id: string,
  input: InventoryItemInput,
): Promise<void> {
  validateInput(input)

  try {
    await updateDoc(doc(db, COLLECTION, id), {
      name: input.name.trim(),
      sku: input.sku.trim(),
      quantity: input.quantity,
      unit: input.unit.trim() || 'un',
      notes: input.notes.trim(),
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw toAppError(error, 'Não foi possível atualizar o item.')
  }
}

export async function deleteInventoryItem(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, id))
  } catch (error) {
    throw toAppError(error, 'Não foi possível excluir o item.')
  }
}

/** Ajusta estoque por delta (negativo = saída). Impede saldo negativo. */
export async function adjustInventoryQuantity(
  id: string,
  delta: number,
): Promise<void> {
  if (!Number.isFinite(delta) || delta === 0) {
    return
  }

  try {
    const item = await getInventoryItemById(id)
    const next = item.quantity + delta
    if (next < 0) {
      throw new AppError(
        'validation',
        `Estoque insuficiente para "${item.name}". Disponível: ${item.quantity} ${item.unit}.`,
      )
    }
    await updateDoc(doc(db, COLLECTION, id), {
      quantity: next,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw toAppError(error, 'Não foi possível atualizar o estoque.')
  }
}
