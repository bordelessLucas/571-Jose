import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
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
    throw new AppError('validation', 'Nome do item e obrigatorio.')
  }
  if (input.quantity < 0 || !Number.isFinite(input.quantity)) {
    throw new AppError('validation', 'Quantidade invalida.')
  }
}

function mapItem(id: string, data: Record<string, unknown>): InventoryItem {
  return {
    id,
    name: requireString(data, 'name'),
    sku: requireString(data, 'sku'),
    quantity: requireNumber(data, 'quantity'),
    unit: requireString(data, 'unit') || 'un',
    defaultUnitPrice: requireNumber(data, 'defaultUnitPrice'),
    ncm: requireString(data, 'ncm'),
    cfop: requireString(data, 'cfop'),
    cest: requireString(data, 'cest'),
    icmsOrigin: requireString(data, 'icmsOrigin'),
    icmsSituation: requireString(data, 'icmsSituation'),
    pisSituation: requireString(data, 'pisSituation'),
    cofinsSituation: requireString(data, 'cofinsSituation'),
    notes: requireString(data, 'notes'),
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  }
}

function toInventoryPayload(input: InventoryItemInput) {
  return {
    name: input.name.trim(),
    sku: input.sku.trim(),
    quantity: input.quantity,
    unit: input.unit.trim() || 'un',
    defaultUnitPrice: input.defaultUnitPrice,
    ncm: input.ncm.trim(),
    cfop: input.cfop.trim(),
    cest: input.cest.trim(),
    icmsOrigin: input.icmsOrigin.trim(),
    icmsSituation: input.icmsSituation.trim(),
    pisSituation: input.pisSituation.trim(),
    cofinsSituation: input.cofinsSituation.trim(),
    notes: input.notes.trim(),
  }
}

export async function listInventoryItems(): Promise<InventoryItem[]> {
  try {
    const snapshot = await getDocs(
      query(collection(db, COLLECTION), orderBy('name')),
    )
    return snapshot.docs.map((item) => mapItem(mapDocId(item), item.data()))
  } catch (error) {
    throw toAppError(error, 'Nao foi possivel carregar o estoque.')
  }
}

export async function getInventoryItemById(id: string): Promise<InventoryItem> {
  try {
    const snapshot = await getDoc(doc(db, COLLECTION, id))
    if (!snapshot.exists()) {
      throw new AppError('not_found', 'Item de estoque nao encontrado.')
    }
    return mapItem(snapshot.id, snapshot.data())
  } catch (error) {
    throw toAppError(error, 'Nao foi possivel carregar o item.')
  }
}

export async function createInventoryItem(
  input: InventoryItemInput,
): Promise<string> {
  validateInput(input)

  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      ...toInventoryPayload(input),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  } catch (error) {
    throw toAppError(error, 'Nao foi possivel cadastrar o item.')
  }
}

export async function updateInventoryItem(
  id: string,
  input: InventoryItemInput,
): Promise<void> {
  validateInput(input)

  try {
    await updateDoc(doc(db, COLLECTION, id), {
      ...toInventoryPayload(input),
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw toAppError(error, 'Nao foi possivel atualizar o item.')
  }
}

export async function deleteInventoryItem(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, id))
  } catch (error) {
    throw toAppError(error, 'Nao foi possivel excluir o item.')
  }
}

/** Ajusta estoque por delta (negativo = saida). Impede saldo negativo. */
export async function adjustInventoryQuantity(
  id: string,
  delta: number,
): Promise<void> {
  if (!Number.isFinite(delta) || delta === 0) {
    return
  }

  try {
    const itemRef = doc(db, COLLECTION, id)
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(itemRef)
      if (!snapshot.exists()) {
        throw new AppError('not_found', 'Item de estoque nao encontrado.')
      }

      const item = mapItem(snapshot.id, snapshot.data())
      const next = item.quantity + delta
      if (next < 0) {
        throw new AppError(
          'validation',
          `Estoque insuficiente para "${item.name}". Disponivel: ${item.quantity} ${item.unit}.`,
        )
      }
      transaction.update(itemRef, {
        quantity: next,
        updatedAt: serverTimestamp(),
      })
    })
  } catch (error) {
    throw toAppError(error, 'Nao foi possivel atualizar o estoque.')
  }
}
