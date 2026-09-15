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
import type { Sale, SaleInput } from '@/domain/types'
import { AppError, toAppError } from '@/lib/errors'
import { getClientById } from '@/services/clients.service'
import { db } from '@/services/firebase'
import {
  mapDocId,
  requireNumber,
  requireString,
  toIsoString,
} from '@/services/firestore.mapper'
import { getSellerById } from '@/services/sellers.service'

const COLLECTION = 'sales'

function validateInput(input: SaleInput): void {
  if (!input.clientId) {
    throw new AppError('validation', 'Selecione um cliente.')
  }
  if (!input.sellerId) {
    throw new AppError('validation', 'Selecione um vendedor.')
  }
  if (!(input.amount > 0)) {
    throw new AppError('validation', 'Informe um valor maior que zero.')
  }
  if (!input.soldAt) {
    throw new AppError('validation', 'Informe a data da venda.')
  }
}

function mapSale(id: string, data: Record<string, unknown>): Sale {
  return {
    id,
    clientId: requireString(data, 'clientId'),
    clientName: requireString(data, 'clientName'),
    sellerId: requireString(data, 'sellerId'),
    sellerName: requireString(data, 'sellerName'),
    amount: requireNumber(data, 'amount'),
    description: requireString(data, 'description'),
    soldAt: requireString(data, 'soldAt'),
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  }
}

/**
 * Valida consistência cliente/vendedor antes de gravar.
 * Em produção, espelhar esta regra em Cloud Functions.
 */
async function resolveSaleRelations(input: SaleInput): Promise<{
  clientName: string
  sellerName: string
}> {
  const [client, seller] = await Promise.all([
    getClientById(input.clientId),
    getSellerById(input.sellerId),
  ])

  if (!seller.active) {
    throw new AppError('validation', 'O vendedor selecionado está inativo.')
  }

  return {
    clientName: client.name,
    sellerName: seller.name,
  }
}

export async function listSales(): Promise<Sale[]> {
  try {
    const snapshot = await getDocs(
      query(collection(db, COLLECTION), orderBy('soldAt', 'desc')),
    )
    return snapshot.docs.map((item) => mapSale(mapDocId(item), item.data()))
  } catch (error) {
    throw toAppError(error, 'Não foi possível carregar as vendas.')
  }
}

export async function getSaleById(id: string): Promise<Sale> {
  try {
    const snapshot = await getDoc(doc(db, COLLECTION, id))
    if (!snapshot.exists()) {
      throw new AppError('not_found', 'Venda não encontrada.')
    }
    return mapSale(snapshot.id, snapshot.data())
  } catch (error) {
    throw toAppError(error, 'Não foi possível carregar a venda.')
  }
}

export async function createSale(input: SaleInput): Promise<string> {
  validateInput(input)

  try {
    const relations = await resolveSaleRelations(input)
    const ref = await addDoc(collection(db, COLLECTION), {
      clientId: input.clientId,
      clientName: relations.clientName,
      sellerId: input.sellerId,
      sellerName: relations.sellerName,
      amount: input.amount,
      description: input.description.trim(),
      soldAt: input.soldAt,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  } catch (error) {
    throw toAppError(error, 'Não foi possível registrar a venda.')
  }
}

export async function updateSale(id: string, input: SaleInput): Promise<void> {
  validateInput(input)

  try {
    const relations = await resolveSaleRelations(input)
    await updateDoc(doc(db, COLLECTION, id), {
      clientId: input.clientId,
      clientName: relations.clientName,
      sellerId: input.sellerId,
      sellerName: relations.sellerName,
      amount: input.amount,
      description: input.description.trim(),
      soldAt: input.soldAt,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw toAppError(error, 'Não foi possível atualizar a venda.')
  }
}

export async function deleteSale(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, id))
  } catch (error) {
    throw toAppError(error, 'Não foi possível excluir a venda.')
  }
}
