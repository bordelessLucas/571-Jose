import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import type { FiscalDocument, FiscalInvoiceResult } from '@/domain/types'
import { AppError, toAppError } from '@/lib/errors'
import { db } from '@/services/firebase'
import {
  mapDocId,
  requireNumber,
  requireString,
  toIsoString,
} from '@/services/firestore.mapper'

const COLLECTION = 'fiscalDocuments'

function mapFiscalDocument(
  id: string,
  data: Record<string, unknown>,
): FiscalDocument {
  return {
    id,
    focusRef: requireString(data, 'focusRef'),
    referenceType: 'sale',
    referenceId: requireString(data, 'referenceId'),
    documentType: 'nfe',
    status: (requireString(data, 'status') || 'draft') as FiscalDocument['status'],
    providerMode: (requireString(data, 'providerMode') ||
      'mock') as FiscalDocument['providerMode'],
    amount: requireNumber(data, 'amount'),
    description: requireString(data, 'description'),
    recipientName: requireString(data, 'recipientName'),
    recipientDocument: requireString(data, 'recipientDocument'),
    externalId: requireString(data, 'externalId') || null,
    protocol: requireString(data, 'protocol') || null,
    message: requireString(data, 'message'),
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  }
}

export async function createFiscalDocument(input: {
  result: FiscalInvoiceResult
  referenceId: string
  amount: number
  description: string
  recipientName: string
  recipientDocument: string
}): Promise<string> {
  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      focusRef: input.result.focusRef,
      referenceType: 'sale',
      referenceId: input.referenceId,
      documentType: 'nfe',
      status: input.result.status,
      providerMode: input.result.providerMode,
      amount: input.amount,
      description: input.description,
      recipientName: input.recipientName,
      recipientDocument: input.recipientDocument,
      externalId: input.result.externalId,
      protocol: input.result.protocol,
      message: input.result.message,
      rawResponse: input.result.rawResponse ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  } catch (error) {
    throw toAppError(error, 'Não foi possível gravar o documento fiscal.')
  }
}

export async function getFiscalDocumentById(id: string): Promise<FiscalDocument> {
  try {
    const snapshot = await getDoc(doc(db, COLLECTION, id))
    if (!snapshot.exists()) {
      throw new AppError('not_found', 'Documento fiscal não encontrado.')
    }
    return mapFiscalDocument(snapshot.id, snapshot.data())
  } catch (error) {
    throw toAppError(error, 'Não foi possível carregar o documento fiscal.')
  }
}

export async function listFiscalDocumentsBySale(
  saleId: string,
): Promise<FiscalDocument[]> {
  try {
    const snapshot = await getDocs(
      query(collection(db, COLLECTION), where('referenceId', '==', saleId)),
    )
    const docs = snapshot.docs.map((item) =>
      mapFiscalDocument(mapDocId(item), item.data()),
    )
    return docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  } catch (error) {
    throw toAppError(error, 'Não foi possível listar documentos fiscais.')
  }
}

export async function updateFiscalDocumentStatus(
  id: string,
  status: FiscalDocument['status'],
  message: string,
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      status,
      message,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw toAppError(error, 'Não foi possível atualizar o documento fiscal.')
  }
}
