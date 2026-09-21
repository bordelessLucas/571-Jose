import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import type {
  FiscalDocument,
  FiscalDocumentType,
  FiscalInvoiceResult,
} from '@/domain/types'
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
    documentType: (requireString(data, 'documentType') || 'nfe') as FiscalDocumentType,
    status: (requireString(data, 'status') || 'draft') as FiscalDocument['status'],
    providerMode: 'live',
    environment:
      (requireString(data, 'environment') as FiscalDocument['environment']) ||
      'homologation',
    isSimulated: false,
    amount: requireNumber(data, 'amount'),
    description: requireString(data, 'description'),
    recipientName: requireString(data, 'recipientName'),
    recipientDocument: requireString(data, 'recipientDocument'),
    externalId: requireString(data, 'externalId') || null,
    protocol: requireString(data, 'protocol') || null,
    number: requireString(data, 'number') || null,
    series: requireString(data, 'series') || null,
    accessKey: requireString(data, 'accessKey') || null,
    sefazStatus: requireString(data, 'sefazStatus') || null,
    xmlUrl: requireString(data, 'xmlUrl') || null,
    pdfUrl: requireString(data, 'pdfUrl') || null,
    qrCodeUrl: requireString(data, 'qrCodeUrl') || null,
    message: requireString(data, 'message'),
    issuedAt: toIsoString(data.issuedAt) || null,
    cancelledAt: toIsoString(data.cancelledAt) || null,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  }
}

export async function createFiscalDocument(input: {
  result: FiscalInvoiceResult
  referenceId: string
  documentType: FiscalDocumentType
  amount: number
  description: string
  recipientName: string
  recipientDocument: string
}): Promise<string> {
  try {
    const ref = doc(db, COLLECTION, input.result.focusRef)
    await setDoc(ref, {
      focusRef: input.result.focusRef,
      referenceType: 'sale',
      referenceId: input.referenceId,
      documentType: input.documentType,
      status: input.result.status,
      providerMode: input.result.providerMode,
      environment: input.result.environment ?? 'homologation',
      isSimulated: false,
      amount: input.amount,
      description: input.description,
      recipientName: input.recipientName,
      recipientDocument: input.recipientDocument,
      externalId: input.result.externalId,
      protocol: input.result.protocol,
      number: input.result.number ?? null,
      series: input.result.series ?? null,
      accessKey: input.result.accessKey ?? input.result.externalId,
      sefazStatus: input.result.sefazStatus ?? null,
      xmlUrl: input.result.xmlUrl ?? null,
      pdfUrl: input.result.pdfUrl ?? null,
      qrCodeUrl: input.result.qrCodeUrl ?? null,
      message: input.result.message,
      issuedAt: input.result.issuedAt ?? null,
      cancelledAt: input.result.cancelledAt ?? null,
      rawResponse: input.result.rawResponse ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  } catch (error) {
    throw toAppError(error, 'Nao foi possivel gravar o documento fiscal.')
  }
}

export async function updateFiscalDocumentFromResult(
  id: string,
  result: FiscalInvoiceResult,
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      status: result.status,
      environment: result.environment ?? 'homologation',
      isSimulated: false,
      externalId: result.externalId,
      protocol: result.protocol,
      number: result.number ?? null,
      series: result.series ?? null,
      accessKey: result.accessKey ?? result.externalId,
      sefazStatus: result.sefazStatus ?? null,
      xmlUrl: result.xmlUrl ?? null,
      pdfUrl: result.pdfUrl ?? null,
      qrCodeUrl: result.qrCodeUrl ?? null,
      message: result.message,
      issuedAt: result.issuedAt ?? null,
      cancelledAt: result.cancelledAt ?? null,
      rawResponse: result.rawResponse ?? null,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw toAppError(error, 'Nao foi possivel atualizar o documento fiscal.')
  }
}

export async function getFiscalDocumentById(id: string): Promise<FiscalDocument> {
  try {
    const snapshot = await getDoc(doc(db, COLLECTION, id))
    if (!snapshot.exists()) {
      throw new AppError('not_found', 'Documento fiscal nao encontrado.')
    }
    return mapFiscalDocument(snapshot.id, snapshot.data())
  } catch (error) {
    throw toAppError(error, 'Nao foi possivel carregar o documento fiscal.')
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
    throw toAppError(error, 'Nao foi possivel listar documentos fiscais.')
  }
}

export async function listFiscalDocuments(): Promise<FiscalDocument[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION))
    const docs = snapshot.docs.map((item) =>
      mapFiscalDocument(mapDocId(item), item.data()),
    )
    return docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  } catch (error) {
    throw toAppError(error, 'Nao foi possivel listar documentos fiscais.')
  }
}

export async function findActiveFiscalDocumentForSale(
  saleId: string,
  documentType: FiscalDocumentType,
): Promise<FiscalDocument | null> {
  const docs = await listFiscalDocumentsBySale(saleId)
  return (
    docs.find(
      (item) =>
        item.documentType === documentType &&
        item.status !== 'cancelled' &&
        item.status !== 'error',
    ) ?? null
  )
}

export async function cancelActiveFiscalDocumentsForSale(
  saleId: string,
  reason: string,
): Promise<number> {
  try {
    const docs = await listFiscalDocumentsBySale(saleId)
    const active = docs.filter((item) => item.status !== 'cancelled')

    await Promise.all(
      active.map((item) =>
        updateDoc(doc(db, COLLECTION, item.id), {
          status: 'cancelled',
          message: reason,
          cancelledAt: new Date().toISOString(),
          updatedAt: serverTimestamp(),
        }),
      ),
    )

    return active.length
  } catch (error) {
    throw toAppError(error, 'Nao foi possivel cancelar documentos fiscais anteriores.')
  }
}
