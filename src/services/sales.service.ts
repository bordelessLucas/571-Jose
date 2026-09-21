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
  DeliveryStatus,
  FiscalDocumentType,
  PaymentMethod,
  Sale,
  SaleInput,
} from '@/domain/types'
import { AppError, toAppError } from '@/lib/errors'
import { addDaysInputValue, computeSaleAmount, todayInputValue } from '@/lib/format'
import {
  addSaleToPaymentTotals,
  emptySalePaymentTotals,
} from '@/lib/salePaymentTotals'
import {
  createAccountReceivable,
  findAccountReceivableBySaleId,
  listAccountsReceivableByClientId,
  updateAccountReceivable,
} from '@/services/accountsReceivable.service'
import { createCashMovement } from '@/services/cash.service'
import { getClientById } from '@/services/clients.service'
import { prepareFiscalEmission } from '@/services/fiscal.service'
import {
  cancelFiscalDocument,
  consultFiscalDocument,
} from '@/services/fiscal.service'
import {
  cancelActiveFiscalDocumentsForSale,
  createFiscalDocument,
  findActiveFiscalDocumentForSale,
  getFiscalDocumentById,
  updateFiscalDocumentFromResult,
} from '@/services/fiscalDocuments.service'
import { db } from '@/services/firebase'
import {
  mapDocId,
  requireBoolean,
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
  'fiado',
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

function saleHasCredit(input: Pick<SaleInput, 'paymentMethod1' | 'paymentMethod2'>): boolean {
  return input.paymentMethod1 === 'fiado' || input.paymentMethod2 === 'fiado'
}

function paymentAmounts(input: SaleInput): { paymentAmount1: number; paymentAmount2: number } {
  const total = computeSaleAmount(input)
  if (!input.paymentMethod2) {
    return { paymentAmount1: total, paymentAmount2: 0 }
  }

  return {
    paymentAmount1: Math.max(0, input.paymentAmount1),
    paymentAmount2: Math.max(0, input.paymentAmount2),
  }
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

  if (input.paymentMethod2) {
    const total = computeSaleAmount(input)
    const amounts = paymentAmounts(input)
    if (!(amounts.paymentAmount1 > 0) || !(amounts.paymentAmount2 > 0)) {
      throw new AppError(
        'validation',
        'Informe os valores das duas formas de pagamento.',
      )
    }
    if (Math.abs(amounts.paymentAmount1 + amounts.paymentAmount2 - total) > 0.01) {
      throw new AppError(
        'validation',
        'A soma das formas de pagamento deve fechar o total da venda.',
      )
    }
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
    originalUnitPrice:
      requireNumber(data, 'originalUnitPrice') ||
      requireNumber(data, 'unitPrice') ||
      requireNumber(data, 'amount'),
    finalUnitPrice:
      requireNumber(data, 'finalUnitPrice') ||
      requireNumber(data, 'unitPrice') ||
      requireNumber(data, 'amount'),
    priceChanged: requireBoolean(data, 'priceChanged', false),
    priceChangedBy: requireString(data, 'priceChangedBy') || null,
    deliveryFee: requireNumber(data, 'deliveryFee'),
    paymentMethod1: isPaymentMethod(paymentMethod1Raw)
      ? paymentMethod1Raw
      : '',
    paymentAmount1:
      requireNumber(data, 'paymentAmount1') ||
      (paymentMethod2Raw ? 0 : requireNumber(data, 'amount')),
    paymentFee1: requireNumber(data, 'paymentFee1'),
    paymentMethod2: isPaymentMethod(paymentMethod2Raw)
      ? paymentMethod2Raw
      : '',
    paymentAmount2: requireNumber(data, 'paymentAmount2'),
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
    deliveryPersonId: requireString(data, 'deliveryPersonId') || null,
    deliveryPersonName: requireString(data, 'deliveryPersonName') || null,
    deliveryStatus:
      (requireString(data, 'deliveryStatus') as Sale['deliveryStatus']) || 'pending',
    deliveryAssignedAt: toIsoString(data.deliveryAssignedAt) || null,
    deliveryOutAt: toIsoString(data.deliveryOutAt) || null,
    deliveredAt: toIsoString(data.deliveredAt) || null,
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
  productDefaultUnitPrice: number
  productSku: string
  productNcm: string
  productCfop: string
  productCest: string
  productIcmsOrigin: string
  productIcmsSituation: string
  productPisSituation: string
  productCofinsSituation: string
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
    productDefaultUnitPrice: product.defaultUnitPrice,
    productSku: product.sku,
    productNcm: product.ncm,
    productCfop: product.cfop,
    productCest: product.cest,
    productIcmsOrigin: product.icmsOrigin,
    productIcmsSituation: product.icmsSituation,
    productPisSituation: product.pisSituation,
    productCofinsSituation: product.cofinsSituation,
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

async function syncFinancialOnCreate(
  saleId: string,
  input: SaleInput,
  client: Client,
  amount: number,
  productName: string,
): Promise<string | null> {
  if (saleHasCredit(input)) {
    return upsertReceivableForSale(
      saleId,
      input,
      client,
      amount,
      productName,
      null,
    )
  }

  await createCashMovement({
    type: 'entrada',
    description: `Venda - ${client.name} - ${productName}`,
    amount,
    movementDate: input.soldAt,
  })

  return null
}

/**
 * Emissao automatica de documento fiscal ao fechar a venda via Focus NFe.
 * Falha fiscal NÃO desfaz a venda — grava status na venda e em fiscalDocuments.
 * Em reemissão: cancela documentos ativos anteriores e usa nova ref Focus.
 */
async function emitFiscalForSale(
  saleId: string,
  documentType: FiscalDocumentType,
  amount: number,
  description: string,
  soldAt: string,
  client: Client,
  fiscalProduct: {
    sku: string
    unit: string
    ncm: string
    cfop: string
    cest: string
    icmsOrigin: string
    icmsSituation: string
    pisSituation: string
    cofinsSituation: string
  },
  options: { reissue?: boolean } = {},
) {
  const reissue = Boolean(options.reissue)

  if (!reissue) {
    const active = await findActiveFiscalDocumentForSale(saleId, documentType)
    if (active) {
      throw new AppError(
        'validation',
        'Ja existe documento fiscal ativo para esta venda. Consulte ou cancele antes de emitir novamente.',
      )
    }
  }

  if (reissue) {
    await cancelActiveFiscalDocumentsForSale(
      saleId,
      'Cancelado automaticamente por reemissão de NF-e.',
    )
  }

  const fallbackRef = `sale-${documentType}-${saleId}`
  const result = await prepareFiscalEmission({
      referenceType: 'sale',
      referenceId: saleId,
      documentType,
      amount,
      description,
      soldAt,
      recipientName: client.name,
      recipientDocument: client.document,
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
      productCest: fiscalProduct.cest,
      productIcmsOrigin: fiscalProduct.icmsOrigin,
      productIcmsSituation: fiscalProduct.icmsSituation,
      productPisSituation: fiscalProduct.pisSituation,
      productCofinsSituation: fiscalProduct.cofinsSituation,
      reissue,
    }).catch(async (error: unknown) => {
      if (error instanceof AppError && error.code === 'validation') {
        await updateDoc(doc(db, COLLECTION, saleId), {
          fiscalStatus: 'fiscal_configuration_incomplete',
          fiscalRef: fallbackRef,
          updatedAt: serverTimestamp(),
        })
      }
      throw error
    })

  const fiscalDocumentId = await createFiscalDocument({
    result,
    referenceId: saleId,
    documentType,
    amount,
    description,
    recipientName: client.name,
    recipientDocument: client.document,
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
  const amounts = paymentAmounts(input)
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
    originalUnitPrice: relations.productDefaultUnitPrice || input.unitPrice,
    finalUnitPrice: input.unitPrice,
    priceChanged:
      relations.productDefaultUnitPrice > 0 &&
      relations.productDefaultUnitPrice !== input.unitPrice,
    priceChangedBy: null,
    deliveryFee: input.deliveryFee,
    paymentMethod1: input.paymentMethod1,
    paymentAmount1: amounts.paymentAmount1,
    paymentFee1: input.paymentFee1,
    paymentMethod2: input.paymentMethod2 || '',
    paymentAmount2: input.paymentMethod2 ? amounts.paymentAmount2 : 0,
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
      deliveryPersonId: null,
      deliveryPersonName: null,
      deliveryStatus: 'pending',
      deliveryAssignedAt: null,
      deliveryOutAt: null,
      deliveredAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    try {
      const receivableId = await syncFinancialOnCreate(
        ref.id,
        input,
        relations.client,
        relations.amount,
        relations.productName,
      )
      await updateDoc(doc(db, COLLECTION, ref.id), {
        receivableId,
        updatedAt: serverTimestamp(),
      })
    } catch (receivableError) {
      console.error('Falha ao gerar conta a receber da venda:', receivableError)
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
      if (saleHasCredit(input)) {
        receivableId = await upsertReceivableForSale(
          id,
          input,
          relations.client,
          relations.amount,
          relations.productName,
          previous.receivableId,
        )
      } else {
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
        receivableId = null
      }
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
export async function emitFiscalDocumentForSale(
  saleId: string,
  documentType: FiscalDocumentType,
): Promise<void> {
  const sale = await getSaleById(saleId)
  const [client, product] = await Promise.all([
    getClientById(sale.clientId),
    getInventoryItemById(sale.productId),
  ])
  await emitFiscalForSale(
    saleId,
    documentType,
    sale.amount,
    sale.description,
    sale.soldAt,
    client,
    {
      sku: product.sku,
      unit: product.unit,
      ncm: product.ncm,
      cfop: product.cfop,
      cest: product.cest,
      icmsOrigin: product.icmsOrigin,
      icmsSituation: product.icmsSituation,
      pisSituation: product.pisSituation,
      cofinsSituation: product.cofinsSituation,
    },
  )
}

export async function reemitNfeForSale(saleId: string): Promise<void> {
  const sale = await getSaleById(saleId)
  const [client, product] = await Promise.all([
    getClientById(sale.clientId),
    getInventoryItemById(sale.productId),
  ])
  await emitFiscalForSale(
    saleId,
    'nfe',
    sale.amount,
    sale.description,
    sale.soldAt,
    client,
    {
      sku: product.sku,
      unit: product.unit,
      ncm: product.ncm,
      cfop: product.cfop,
      cest: product.cest,
      icmsOrigin: product.icmsOrigin,
      icmsSituation: product.icmsSituation,
      pisSituation: product.pisSituation,
      cofinsSituation: product.cofinsSituation,
    },
    { reissue: true },
  )
}

export async function consultFiscalDocumentForSale(saleId: string): Promise<void> {
  const sale = await getSaleById(saleId)
  if (!sale.fiscalDocumentId) {
    throw new AppError('validation', 'Venda ainda nao possui documento fiscal.')
  }
  const document = await getFiscalDocumentById(sale.fiscalDocumentId)
  const result = await consultFiscalDocument(document)
  await updateFiscalDocumentFromResult(document.id, result)
  await updateDoc(doc(db, COLLECTION, saleId), {
    fiscalStatus: result.status,
    fiscalRef: result.focusRef,
    updatedAt: serverTimestamp(),
  })
}

export async function cancelFiscalDocumentForSale(
  saleId: string,
  justification: string,
): Promise<void> {
  const sale = await getSaleById(saleId)
  if (!sale.fiscalDocumentId) {
    throw new AppError('validation', 'Venda ainda nao possui documento fiscal.')
  }
  const document = await getFiscalDocumentById(sale.fiscalDocumentId)
  const result = await cancelFiscalDocument(document, justification)
  await updateFiscalDocumentFromResult(document.id, result)
  await updateDoc(doc(db, COLLECTION, saleId), {
    fiscalStatus: result.status,
    fiscalRef: result.focusRef,
    updatedAt: serverTimestamp(),
  })
}

export async function assignDeliveryPerson(
  saleId: string,
  deliveryPersonId: string,
): Promise<void> {
  const sale = await getSaleById(saleId)
  if (sale.deliveryStatus === 'delivered' || sale.deliveryStatus === 'cancelled') {
    throw new AppError(
      'validation',
      'Nao e possivel atribuir entregador para entrega finalizada ou cancelada.',
    )
  }

  const seller = await getSellerById(deliveryPersonId)
  if (!seller.active) {
    throw new AppError('validation', 'Entregador selecionado esta inativo.')
  }

  try {
    await updateDoc(doc(db, COLLECTION, saleId), {
      deliveryPersonId: seller.id,
      deliveryPersonName: seller.name,
      deliveryStatus: 'assigned',
      deliveryAssignedAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw toAppError(error, 'Nao foi possivel atribuir o entregador.')
  }
}

export async function updateDeliveryStatus(
  saleId: string,
  status: DeliveryStatus,
): Promise<void> {
  const sale = await getSaleById(saleId)
  const allowed: Record<DeliveryStatus, DeliveryStatus[]> = {
    pending: ['assigned', 'cancelled'],
    assigned: ['out_for_delivery', 'cancelled'],
    out_for_delivery: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
  }

  if (!allowed[sale.deliveryStatus].includes(status)) {
    throw new AppError('validation', 'Transicao de entrega invalida.')
  }

  const patch: Record<string, unknown> = {
    deliveryStatus: status,
    updatedAt: serverTimestamp(),
  }

  if (status === 'out_for_delivery') {
    patch.deliveryOutAt = new Date().toISOString()
  }
  if (status === 'delivered') {
    patch.deliveredAt = new Date().toISOString()
  }

  try {
    await updateDoc(doc(db, COLLECTION, saleId), patch)
  } catch (error) {
    throw toAppError(error, 'Nao foi possivel atualizar a entrega.')
  }
}

export type DeliveryPersonClosing = {
  deliveryPersonId: string
  deliveryPersonName: string
  deliveries: number
  salesTotal: number
  cashTotal: number
  pixTotal: number
  creditTotal: number
  accountabilityTotal: number
  sales: Sale[]
}

export async function getDeliveryClosing(date: string): Promise<DeliveryPersonClosing[]> {
  const sales = (await listSales()).filter(
    (sale) => sale.soldAt === date && sale.deliveryPersonId,
  )
  const groups = new Map<string, DeliveryPersonClosing>()

  for (const sale of sales) {
    const key = sale.deliveryPersonId ?? ''
    const current =
      groups.get(key) ??
      {
        deliveryPersonId: key,
        deliveryPersonName: sale.deliveryPersonName ?? 'Sem entregador',
        deliveries: 0,
        salesTotal: 0,
        cashTotal: 0,
        pixTotal: 0,
        creditTotal: 0,
        accountabilityTotal: 0,
        sales: [],
      }

    current.deliveries += sale.deliveryStatus === 'delivered' ? 1 : 0
    current.salesTotal += sale.amount
    const totals = addSaleToPaymentTotals(emptySalePaymentTotals(), sale)
    current.cashTotal += totals.dinheiro
    current.pixTotal += totals.pix
    current.creditTotal += totals.fiado
    current.accountabilityTotal += totals.dinheiro
    current.sales.push(sale)
    groups.set(key, current)
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.deliveryPersonName.localeCompare(b.deliveryPersonName),
  )
}
