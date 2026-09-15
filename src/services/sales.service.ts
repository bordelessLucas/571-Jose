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
import type { Client, Sale, SaleInput } from '@/domain/types'
import { AppError, toAppError } from '@/lib/errors'
import { getClientById } from '@/services/clients.service'
import { prepareFiscalEmission } from '@/services/fiscal.service'
import { createFiscalDocument } from '@/services/fiscalDocuments.service'
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
  const fiscalStatusRaw = requireString(data, 'fiscalStatus')
  return {
    id,
    clientId: requireString(data, 'clientId'),
    clientName: requireString(data, 'clientName'),
    sellerId: requireString(data, 'sellerId'),
    sellerName: requireString(data, 'sellerName'),
    amount: requireNumber(data, 'amount'),
    description: requireString(data, 'description'),
    soldAt: requireString(data, 'soldAt'),
    fiscalDocumentId: requireString(data, 'fiscalDocumentId') || null,
    fiscalStatus: fiscalStatusRaw
      ? (fiscalStatusRaw as Sale['fiscalStatus'])
      : null,
    fiscalRef: requireString(data, 'fiscalRef') || null,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  }
}

async function resolveSaleRelations(input: SaleInput): Promise<{
  client: Client
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
    client,
    sellerName: seller.name,
  }
}

/**
 * Emissão automática de NF-e ao fechar a venda (Focus NFe mock/live).
 * Falha fiscal NÃO desfaz a venda — grava status na venda e em fiscalDocuments.
 */
async function emitNfeForSale(saleId: string, input: SaleInput, client: Client) {
  const result = await prepareFiscalEmission({
    referenceType: 'sale',
    referenceId: saleId,
    documentType: 'nfe',
    amount: input.amount,
    description: input.description.trim() || `Venda ${saleId}`,
    soldAt: input.soldAt,
    recipientName: client.name,
    recipientDocument: client.document || '00000000000',
    recipientEmail: client.email,
    recipientPhone: client.phone,
  })

  const fiscalDocumentId = await createFiscalDocument({
    result,
    referenceId: saleId,
    amount: input.amount,
    description: input.description.trim() || `Venda ${saleId}`,
    recipientName: client.name,
    recipientDocument: client.document || '00000000000',
  })

  await updateDoc(doc(db, COLLECTION, saleId), {
    fiscalDocumentId,
    fiscalStatus: result.status,
    fiscalRef: result.focusRef,
    updatedAt: serverTimestamp(),
  })

  return result
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
      clientName: relations.client.name,
      sellerId: input.sellerId,
      sellerName: relations.sellerName,
      amount: input.amount,
      description: input.description.trim(),
      soldAt: input.soldAt,
      fiscalDocumentId: null,
      fiscalStatus: null,
      fiscalRef: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    try {
      await emitNfeForSale(ref.id, input, relations.client)
    } catch (fiscalError) {
      await updateDoc(doc(db, COLLECTION, ref.id), {
        fiscalStatus: 'error',
        fiscalRef: `sale-${ref.id}`,
        updatedAt: serverTimestamp(),
      })
      console.error('Falha na emissão automática de NF-e:', fiscalError)
    }

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
      clientName: relations.client.name,
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

/** Reprocessa NF-e de uma venda já existente. */
export async function reemitNfeForSale(saleId: string): Promise<void> {
  const sale = await getSaleById(saleId)
  const client = await getClientById(sale.clientId)
  await emitNfeForSale(saleId, {
    clientId: sale.clientId,
    sellerId: sale.sellerId,
    amount: sale.amount,
    description: sale.description,
    soldAt: sale.soldAt,
  }, client)
}
