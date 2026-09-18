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
  where,
} from 'firebase/firestore'
import type {
  Client,
  ClientCommercialInsight,
  PaymentMethod,
  Sale,
  SaleInput,
} from '@/domain/types'
import { AppError, toAppError } from '@/lib/errors'
import { addDaysInputValue, computeSaleAmount, todayInputValue } from '@/lib/format'
import {
  createAccountReceivable,
  findAccountReceivableBySaleId,
  listAccountsReceivableByClientId,
  updateAccountReceivable,
} from '@/services/accountsReceivable.service'
import { getClientById } from '@/services/clients.service'
import { prepareFiscalEmission } from '@/services/fiscal.service'
import {
  cancelActiveFiscalDocumentsForSale,
  createFiscalDocument,
} from '@/services/fiscalDocuments.service'
import { db } from '@/services/firebase'
import {
  mapDocId,
  requireNumber,
  requireString,
  toIsoString,
} from '@/services/firestore.mapper'
import {
  adjustInventoryQuantity,
  getInventoryItemById,
} from '@/services/inventory.service'
import { getSellerById } from '@/services/sellers.service'

const COLLECTION = 'sales'

const VALID_PAYMENT: PaymentMethod[] = [
  'dinheiro',
  'pix',
  'cartao_credito',
  'cartao_debito',
  'boleto',
  'transferencia',
  'cheque',
  '',
]

function isPaymentMethod(value: string): value is PaymentMethod {
  return VALID_PAYMENT.includes(value as PaymentMethod)
}

function validateInput(input: SaleInput): void {
  if (!input.clientId) {
    throw new AppError('validation', 'Selecione um cliente.')
  }
  if (!input.sellerId) {
    throw new AppError('validation', 'Selecione um vendedor.')
  }
  if (!input.productId) {
    throw new AppError('validation', 'Selecione um produto.')
  }
  if (!(input.quantity > 0)) {
    throw new AppError('validation', 'Informe uma quantidade maior que zero.')
  }
  if (!(input.unitPrice > 0)) {
    throw new AppError('validation', 'Informe um valor unitário maior que zero.')
  }
  if (input.deliveryFee < 0 || input.paymentFee1 < 0 || input.paymentFee2 < 0) {
    throw new AppError('validation', 'Taxas não podem ser negativas.')
  }
  if (!input.paymentMethod1 || !isPaymentMethod(input.paymentMethod1)) {
    throw new AppError('validation', 'Selecione a primeira forma de pagamento.')
  }
  if (input.paymentMethod2 && !isPaymentMethod(input.paymentMethod2)) {
    throw new AppError('validation', 'Segunda forma de pagamento inválida.')
  }
  if (!input.soldAt) {
    throw new AppError('validation', 'Informe a data da venda.')
  }
  if (!input.dueDate) {
    throw new AppError('validation', 'Informe a data de vencimento.')
  }
  if (!(computeSaleAmount(input) > 0)) {
    throw new AppError('validation', 'O total da venda deve ser maior que zero.')
  }
}

function mapSale(id: string, data: Record<string, unknown>): Sale {
  const fiscalStatusRaw = requireString(data, 'fiscalStatus')
  const paymentMethod1Raw = requireString(data, 'paymentMethod1')
  const paymentMethod2Raw = requireString(data, 'paymentMethod2')

  return {
    id,
    clientId: requireString(data, 'clientId'),
    clientName: requireString(data, 'clientName'),
    clientPhone: requireString(data, 'clientPhone'),
    clientAddress: requireString(data, 'clientAddress'),
    sellerId: requireString(data, 'sellerId'),
    sellerName: requireString(data, 'sellerName'),
    productId: requireString(data, 'productId'),
    productName: requireString(data, 'productName'),
    quantity: requireNumber(data, 'quantity') || 1,
    unitPrice: requireNumber(data, 'unitPrice') || requireNumber(data, 'amount'),
    deliveryFee: requireNumber(data, 'deliveryFee'),
    paymentMethod1: isPaymentMethod(paymentMethod1Raw)
      ? paymentMethod1Raw
      : '',
    paymentFee1: requireNumber(data, 'paymentFee1'),
    paymentMethod2: isPaymentMethod(paymentMethod2Raw)
      ? paymentMethod2Raw
      : '',
    paymentFee2: requireNumber(data, 'paymentFee2'),
    dueDate:
      requireString(data, 'dueDate') ||
      addDaysInputValue(requireString(data, 'soldAt') || todayInputValue(), 30),
    amount: requireNumber(data, 'amount'),
    description: requireString(data, 'description'),
    soldAt: requireString(data, 'soldAt'),
    receivableId: requireString(data, 'receivableId') || null,
    fiscalDocumentId: requireString(data, 'fiscalDocumentId') || null,
    fiscalStatus: fiscalStatusRaw
      ? (fiscalStatusRaw as Sale['fiscalStatus'])
      : null,
    fiscalRef: requireString(data, 'fiscalRef') || null,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  }
}

function buildDescription(input: SaleInput, productName: string): string {
  const trimmed = input.description.trim()
  if (trimmed) return trimmed
  return `${productName} × ${input.quantity}`
}

async function resolveSaleRelations(input: SaleInput): Promise<{
  client: Client
  sellerName: string
  productName: string
  productUnit: string
  productSku: string
  productNcm: string
  productCfop: string
  productIcmsOrigin: string
  productIcmsSituation: string
  stockQuantity: number
  amount: number
}> {
  const [client, seller, product] = await Promise.all([
    getClientById(input.clientId),
    getSellerById(input.sellerId),
    getInventoryItemById(input.productId),
  ])

  if (!seller.active) {
    throw new AppError('validation', 'O vendedor selecionado está inativo.')
  }

  return {
    client,
    sellerName: seller.name,
    productName: product.name,
    productUnit: product.unit,
    productSku: product.sku,
    productNcm: product.ncm,
    productCfop: product.cfop,
    productIcmsOrigin: product.icmsOrigin,
    productIcmsSituation: product.icmsSituation,
    stockQuantity: product.quantity,
    amount: computeSaleAmount(input),
  }
}

async function syncStockOnCreate(productId: string, quantity: number): Promise<void> {
  await adjustInventoryQuantity(productId, -quantity)
}

async function syncStockOnUpdate(
  previous: Sale,
  nextProductId: string,
  nextQuantity: number,
): Promise<void> {
  if (previous.productId && previous.productId === nextProductId) {
    const delta = previous.quantity - nextQuantity
    if (delta !== 0) {
      await adjustInventoryQuantity(nextProductId, delta)
    }
    return
  }

  if (previous.productId && previous.quantity > 0) {
    await adjustInventoryQuantity(previous.productId, previous.quantity)
  }
  await adjustInventoryQuantity(nextProductId, -nextQuantity)
}

async function syncStockOnDelete(sale: Sale): Promise<void> {
  if (sale.productId && sale.quantity > 0) {
    await adjustInventoryQuantity(sale.productId, sale.quantity)
  }
}

async function upsertReceivableForSale(
  saleId: string,
  input: SaleInput,
  client: Client,
  amount: number,
  productName: string,
  existingReceivableId: string | null,
): Promise<string> {
  const payload = {
    description: `Venda — ${client.name} — ${productName}`,
    amount,
    dueDate: input.dueDate,
    status: 'pendente' as const,
    clientId: client.id,
    clientName: client.name,
    saleId,
  }

  if (existingReceivableId) {
    const existing = await findAccountReceivableBySaleId(saleId)
    if (existing) {
      await updateAccountReceivable(existing.id, {
        ...payload,
        status: existing.status === 'pago' ? 'pago' : payload.status,
      })
      return existing.id
    }
  }

  const linked = await findAccountReceivableBySaleId(saleId)
  if (linked) {
    await updateAccountReceivable(linked.id, {
      ...payload,
      status: linked.status === 'pago' ? 'pago' : payload.status,
    })
    return linked.id
  }

  return createAccountReceivable(payload)
}

/**
 * Emissão automática de NF-e ao fechar a venda (Focus NFe mock/live).
 * Falha fiscal NÃO desfaz a venda — grava status na venda e em fiscalDocuments.
 * Em reemissão: cancela documentos ativos anteriores e usa nova ref Focus.
 */
async function emitNfeForSale(
  saleId: string,
  amount: number,
  description: string,
  soldAt: string,
  client: Client,
  fiscalProduct: {
    sku: string
    unit: string
    ncm: string
    cfop: string
    icmsOrigin: string
    icmsSituation: string
  },
  options: { reissue?: boolean } = {},
) {
  const reissue = Boolean(options.reissue)

  if (reissue) {
    await cancelActiveFiscalDocumentsForSale(
      saleId,
      'Cancelado automaticamente por reemissão de NF-e.',
    )
  }

  const result = await prepareFiscalEmission({
    referenceType: 'sale',
    referenceId: saleId,
    documentType: 'nfe',
    amount,
    description,
    soldAt,
    recipientName: client.name,
    recipientDocument: client.document || '00000000000',
    recipientEmail: client.email,
    recipientPhone: client.phone,
    recipientAddress: client.address,
    recipientAddressNumber: client.addressNumber,
    recipientDistrict: client.district,
    recipientCity: client.city,
    recipientState: client.state,
    recipientZipCode: client.zipCode,
    recipientStateRegistration: client.stateRegistration,
    recipientStateRegistrationIndicator: client.stateRegistrationIndicator,
    productCode: fiscalProduct.sku || saleId.slice(0, 12),
    productUnit: fiscalProduct.unit,
    productNcm: fiscalProduct.ncm,
    productCfop: fiscalProduct.cfop,
    productIcmsOrigin: fiscalProduct.icmsOrigin,
    productIcmsSituation: fiscalProduct.icmsSituation,
    reissue,
  })

  const fiscalDocumentId = await createFiscalDocument({
    result,
    referenceId: saleId,
    amount,
    description,
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

function toSalePayload(
  input: SaleInput,
  relations: Awaited<ReturnType<typeof resolveSaleRelations>>,
) {
  const description = buildDescription(input, relations.productName)
  return {
    clientId: input.clientId,
    clientName: relations.client.name,
    clientPhone: relations.client.phone,
    clientAddress: relations.client.address,
    sellerId: input.sellerId,
    sellerName: relations.sellerName,
    productId: input.productId,
    productName: relations.productName,
    quantity: input.quantity,
    unitPrice: input.unitPrice,
    deliveryFee: input.deliveryFee,
    paymentMethod1: input.paymentMethod1,
    paymentFee1: input.paymentFee1,
    paymentMethod2: input.paymentMethod2 || '',
    paymentFee2: input.paymentMethod2 ? input.paymentFee2 : 0,
    dueDate: input.dueDate,
    amount: relations.amount,
    description,
    soldAt: input.soldAt,
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

export async function listSalesByClientId(clientId: string): Promise<Sale[]> {
  if (!clientId) return []

  try {
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTION),
        where('clientId', '==', clientId),
        orderBy('soldAt', 'desc'),
      ),
    )
    return snapshot.docs.map((item) => mapSale(mapDocId(item), item.data()))
  } catch (error) {
    try {
      const all = await listSales()
      return all
        .filter((sale) => sale.clientId === clientId)
        .sort((a, b) => b.soldAt.localeCompare(a.soldAt))
    } catch {
      throw toAppError(error, 'Não foi possível carregar as compras do cliente.')
    }
  }
}

export async function getClientCommercialInsight(
  clientId: string,
): Promise<ClientCommercialInsight> {
  const today = todayInputValue()
  const [sales, receivables] = await Promise.all([
    listSalesByClientId(clientId),
    listAccountsReceivableByClientId(clientId),
  ])

  const pending = receivables.filter((item) => item.status === 'pendente')
  const overdueDebt = pending.filter((item) => item.dueDate < today)
  const upcomingDebt = pending.filter((item) => item.dueDate >= today)

  return {
    recentSales: sales.slice(0, 5),
    overdueDebt,
    upcomingDebt,
    overdueTotal: overdueDebt.reduce((sum, item) => sum + item.amount, 0),
    upcomingTotal: upcomingDebt.reduce((sum, item) => sum + item.amount, 0),
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
    if (input.quantity > relations.stockQuantity) {
      throw new AppError(
        'validation',
        `Estoque insuficiente. Disponível: ${relations.stockQuantity} ${relations.productUnit}.`,
      )
    }

    const payload = toSalePayload(input, relations)
    await syncStockOnCreate(input.productId, input.quantity)

    const ref = await addDoc(collection(db, COLLECTION), {
      ...payload,
      receivableId: null,
      fiscalDocumentId: null,
      fiscalStatus: null,
      fiscalRef: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    try {
      const receivableId = await upsertReceivableForSale(
        ref.id,
        input,
        relations.client,
        relations.amount,
        relations.productName,
        null,
      )
      await updateDoc(doc(db, COLLECTION, ref.id), {
        receivableId,
        updatedAt: serverTimestamp(),
      })
    } catch (receivableError) {
      console.error('Falha ao gerar conta a receber da venda:', receivableError)
    }

    try {
      await emitNfeForSale(
        ref.id,
        relations.amount,
        payload.description,
        input.soldAt,
        relations.client,
        {
          sku: relations.productSku,
          unit: relations.productUnit,
          ncm: relations.productNcm,
          cfop: relations.productCfop,
          icmsOrigin: relations.productIcmsOrigin,
          icmsSituation: relations.productIcmsSituation,
        },
      )
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
    const previous = await getSaleById(id)
    const relations = await resolveSaleRelations(input)

    const available =
      relations.stockQuantity +
      (previous.productId === input.productId ? previous.quantity : 0)
    if (input.quantity > available) {
      throw new AppError(
        'validation',
        `Estoque insuficiente. Disponível: ${available} ${relations.productUnit}.`,
      )
    }

    await syncStockOnUpdate(previous, input.productId, input.quantity)
    const payload = toSalePayload(input, relations)

    let receivableId = previous.receivableId
    try {
      receivableId = await upsertReceivableForSale(
        id,
        input,
        relations.client,
        relations.amount,
        relations.productName,
        previous.receivableId,
      )
    } catch (receivableError) {
      console.error('Falha ao sincronizar conta a receber:', receivableError)
    }

    await updateDoc(doc(db, COLLECTION, id), {
      ...payload,
      receivableId,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw toAppError(error, 'Não foi possível atualizar a venda.')
  }
}

export async function deleteSale(id: string): Promise<void> {
  try {
    const sale = await getSaleById(id)
    await syncStockOnDelete(sale)

    const linked = await findAccountReceivableBySaleId(id)
    if (linked && linked.status === 'pendente') {
      await updateAccountReceivable(linked.id, {
        description: linked.description,
        amount: linked.amount,
        dueDate: linked.dueDate,
        status: 'cancelado',
        clientId: linked.clientId,
        clientName: linked.clientName,
        saleId: linked.saleId,
      })
    }

    await deleteDoc(doc(db, COLLECTION, id))
  } catch (error) {
    throw toAppError(error, 'Não foi possível excluir a venda.')
  }
}

/** Reprocessa NF-e de uma venda já existente (cancela a anterior). */
export async function reemitNfeForSale(saleId: string): Promise<void> {
  const sale = await getSaleById(saleId)
  const [client, product] = await Promise.all([
    getClientById(sale.clientId),
    getInventoryItemById(sale.productId),
  ])
  await emitNfeForSale(
    saleId,
    sale.amount,
    sale.description,
    sale.soldAt,
    client,
    {
      sku: product.sku,
      unit: product.unit,
      ncm: product.ncm,
      cfop: product.cfop,
      icmsOrigin: product.icmsOrigin,
      icmsSituation: product.icmsSituation,
    },
    { reissue: true },
  )
}
