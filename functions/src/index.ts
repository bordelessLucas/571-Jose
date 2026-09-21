import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'

initializeApp()
const firestore = getFirestore()

const focusNfeToken = defineSecret('FOCUS_NFE_TOKEN')

type FocusNfeEnvironment = 'homologacao' | 'producao'
type FiscalDocumentType = 'nfe' | 'nfce'
type FiscalDocumentStatus =
  | 'draft'
  | 'fiscal_configuration_incomplete'
  | 'processing'
  | 'authorized'
  | 'rejected'
  | 'cancelled'
  | 'error'

type FiscalInvoiceRequest = {
  referenceType: 'sale'
  referenceId: string
  documentType: FiscalDocumentType
  amount: number
  description: string
  soldAt: string
  recipientName: string
  recipientDocument: string
  recipientEmail?: string
  recipientPhone?: string
  recipientAddress?: string
  recipientAddressNumber?: string
  recipientDistrict?: string
  recipientCity?: string
  recipientState?: string
  recipientZipCode?: string
  recipientStateRegistration?: string
  recipientStateRegistrationIndicator?: '1' | '2' | '9'
  productCode?: string
  productUnit?: string
  productNcm?: string
  productCfop?: string
  productCest?: string
  productIcmsOrigin?: string
  productIcmsSituation?: string
  productPisSituation?: string
  productCofinsSituation?: string
  reissue?: boolean
}

type FocusActionRequest = {
  action?: 'emit' | 'status' | 'cancel'
  saleId: string
  documentType: FiscalDocumentType
  focusRef?: string
  justification?: string
  reissue?: boolean
}

type SaleRecord = {
  clientId: string
  productId: string
  amount: number
  description: string
  soldAt: string
}

type ClientRecord = {
  name: string
  document: string
  email?: string
  phone?: string
  address?: string
  addressNumber?: string
  district?: string
  city?: string
  state?: string
  zipCode?: string
  stateRegistration?: string
  stateRegistrationIndicator?: '1' | '2' | '9'
}

type ProductRecord = {
  sku?: string
  unit?: string
  ncm?: string
  cfop?: string
  cest?: string
  icmsOrigin?: string
  icmsSituation?: string
  pisSituation?: string
  cofinsSituation?: string
}

type FocusHttpResponse = {
  status?: string
  mensagem?: string
  protocolo?: string
  chave_nfe?: string
  chave_nfce?: string
  numero?: string
  serie?: string
  caminho_xml_nota_fiscal?: string
  caminho_danfe?: string
  caminho_xml_cancelamento?: string
  caminho_pdf_cancelamento?: string
  qrcode_url?: string
  erros?: unknown
}

function env(key: string, fallback = ''): string {
  const value = process.env[key]
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function stringField(data: FirebaseFirestore.DocumentData, key: string): string {
  const value = data[key]
  return typeof value === 'string' ? value : ''
}

function numberField(data: FirebaseFirestore.DocumentData, key: string): number {
  const value = data[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function stateRegistrationIndicator(
  value: string,
): '1' | '2' | '9' | undefined {
  return value === '1' || value === '2' || value === '9' ? value : undefined
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function focusBaseUrl(): string {
  const environment = env('FOCUS_NFE_ENV', 'homologacao') as FocusNfeEnvironment
  return environment === 'producao'
    ? 'https://api.focusnfe.com.br'
    : 'https://homologacao.focusnfe.com.br'
}

function focusRef(saleId: string, documentType: FiscalDocumentType, reissue = false): string {
  const prefix = documentType === 'nfce' ? 'sale-nfce' : 'sale-nfe'
  return reissue ? `${prefix}-${saleId}-r${Date.now()}` : `${prefix}-${saleId}`
}

function toFocusDate(isoDate: string): string {
  return isoDate.includes('T') ? isoDate : `${isoDate}T12:00:00-03:00`
}

function formatMoney(value: number): string {
  return value.toFixed(2)
}

function mapFocusStatus(status: string | undefined): FiscalDocumentStatus {
  switch ((status ?? '').toLowerCase()) {
    case 'autorizado':
      return 'authorized'
    case 'erro_autorizacao':
    case 'denegado':
      return 'rejected'
    case 'cancelado':
      return 'cancelled'
    case 'processando_autorizacao':
      return 'processing'
    default:
      return 'processing'
  }
}

function missing(label: string, value: string | undefined): string[] {
  return value && value.trim().length > 0 ? [] : [label]
}

function validatePayload(request: FiscalInvoiceRequest): string[] {
  const issues = [
    ...missing('CNPJ do emitente ausente', env('EMITENTE_CNPJ')),
    ...missing('nome do emitente ausente', env('EMITENTE_NOME')),
    ...missing('logradouro do emitente ausente', env('EMITENTE_LOGRADOURO')),
    ...missing('numero do emitente ausente', env('EMITENTE_NUMERO')),
    ...missing('bairro do emitente ausente', env('EMITENTE_BAIRRO')),
    ...missing('municipio do emitente ausente', env('EMITENTE_MUNICIPIO')),
    ...missing('UF do emitente ausente', env('EMITENTE_UF')),
    ...missing('CEP do emitente ausente', env('EMITENTE_CEP')),
    ...missing('IE do emitente ausente', env('EMITENTE_IE')),
    ...missing('regime tributario ausente', env('EMITENTE_REGIME')),
    ...missing('nome do destinatario ausente', request.recipientName),
    ...missing('documento do destinatario ausente', request.recipientDocument),
    ...missing('endereco fiscal do destinatario ausente', request.recipientAddress),
    ...missing('numero fiscal do destinatario ausente', request.recipientAddressNumber),
    ...missing('bairro fiscal do destinatario ausente', request.recipientDistrict),
    ...missing('municipio fiscal do destinatario ausente', request.recipientCity),
    ...missing('UF fiscal do destinatario ausente', request.recipientState),
    ...missing('CEP fiscal do destinatario ausente', request.recipientZipCode),
    ...missing('unidade fiscal do produto ausente', request.productUnit),
    ...missing('NCM ausente', request.productNcm),
    ...missing('CFOP ausente', request.productCfop),
    ...missing('origem ICMS ausente', request.productIcmsOrigin),
    ...missing('CST/CSOSN ausente', request.productIcmsSituation),
  ]

  if (request.documentType === 'nfe') {
    issues.push(...missing('serie NF-e ausente', env('FOCUS_NFE_SERIE_NFE')))
  }
  if (request.documentType === 'nfce') {
    issues.push(...missing('serie NFC-e ausente', env('FOCUS_NFE_SERIE_NFCE')))
    if (env('FOCUS_NFE_ENV', 'homologacao') === 'producao') {
      issues.push(...missing('CSC NFC-e ausente', env('FOCUS_NFE_CSC_NFCE')))
      issues.push(...missing('ID CSC NFC-e ausente', env('FOCUS_NFE_ID_CSC_NFCE')))
    }
  }
  if (!(request.amount > 0)) {
    issues.push('valor da emissao deve ser maior que zero')
  }

  return issues
}

function mapSaleToFocusPayload(request: FiscalInvoiceRequest) {
  const doc = onlyDigits(request.recipientDocument)
  const amount = formatMoney(request.amount)
  const isCnpj = doc.length > 11

  return {
    natureza_operacao: 'Venda de mercadoria',
    data_emissao: toFocusDate(request.soldAt),
    tipo_documento: '1',
    local_destino: '1',
    finalidade_emissao: '1',
    consumidor_final: '1',
    presenca_comprador: request.documentType === 'nfce' ? '1' : '9',
    serie:
      request.documentType === 'nfce'
        ? env('FOCUS_NFE_SERIE_NFCE')
        : env('FOCUS_NFE_SERIE_NFE'),
    cnpj_emitente: onlyDigits(env('EMITENTE_CNPJ')),
    nome_emitente: env('EMITENTE_NOME'),
    nome_fantasia_emitente: env('EMITENTE_NOME_FANTASIA', env('EMITENTE_NOME')),
    logradouro_emitente: env('EMITENTE_LOGRADOURO'),
    numero_emitente: env('EMITENTE_NUMERO'),
    bairro_emitente: env('EMITENTE_BAIRRO'),
    municipio_emitente: env('EMITENTE_MUNICIPIO'),
    uf_emitente: env('EMITENTE_UF'),
    cep_emitente: onlyDigits(env('EMITENTE_CEP')),
    inscricao_estadual_emitente: env('EMITENTE_IE'),
    regime_tributario_emitente: env('EMITENTE_REGIME'),
    nome_destinatario: request.recipientName,
    ...(isCnpj ? { cnpj_destinatario: doc } : { cpf_destinatario: doc }),
    indicador_inscricao_estadual_destinatario:
      request.recipientStateRegistrationIndicator ?? '9',
    inscricao_estadual_destinatario: request.recipientStateRegistration || undefined,
    logradouro_destinatario: request.recipientAddress,
    numero_destinatario: request.recipientAddressNumber,
    bairro_destinatario: request.recipientDistrict,
    municipio_destinatario: request.recipientCity,
    uf_destinatario: request.recipientState,
    cep_destinatario: onlyDigits(request.recipientZipCode ?? ''),
    pais_destinatario: 'Brasil',
    telefone_destinatario: request.recipientPhone
      ? onlyDigits(request.recipientPhone)
      : undefined,
    modalidade_frete: '9',
    items: [
      {
        numero_item: '1',
        codigo_produto: request.productCode || request.referenceId.slice(0, 12),
        descricao: request.description,
        cfop: request.productCfop,
        unidade_comercial: request.productUnit,
        quantidade_comercial: '1.0000',
        valor_unitario_comercial: amount,
        valor_unitario_tributavel: amount,
        unidade_tributavel: request.productUnit,
        codigo_ncm: onlyDigits(request.productNcm ?? ''),
        cest: request.productCest || undefined,
        quantidade_tributavel: '1.0000',
        valor_bruto: amount,
        icms_origem: request.productIcmsOrigin,
        icms_situacao_tributaria: request.productIcmsSituation,
        pis_situacao_tributaria: request.productPisSituation || undefined,
        cofins_situacao_tributaria: request.productCofinsSituation || undefined,
      },
    ],
  }
}

async function assertAuthenticated(
  request: Parameters<Parameters<typeof onRequest>[0]>[0],
) {
  const header = request.header('authorization') ?? ''
  const match = header.match(/^Bearer (.+)$/)

  if (!match) {
    throw new Error('unauthenticated')
  }

  await getAuth().verifyIdToken(match[1])
}

async function getDocumentData(collection: string, id: string) {
  const snapshot = await firestore.collection(collection).doc(id).get()
  if (!snapshot.exists) {
    throw new Error(`${collection}/${id} nao encontrado.`)
  }
  return snapshot.data() ?? {}
}

async function buildFiscalRequest(input: FocusActionRequest): Promise<FiscalInvoiceRequest> {
  if (!input.saleId) {
    throw new Error('Venda nao informada.')
  }
  if (input.documentType !== 'nfe' && input.documentType !== 'nfce') {
    throw new Error('Tipo de documento fiscal invalido.')
  }

  const saleData = await getDocumentData('sales', input.saleId)
  const sale: SaleRecord = {
    clientId: stringField(saleData, 'clientId'),
    productId: stringField(saleData, 'productId'),
    amount: numberField(saleData, 'amount'),
    description: stringField(saleData, 'description'),
    soldAt: stringField(saleData, 'soldAt'),
  }

  const [clientData, productData] = await Promise.all([
    getDocumentData('clients', sale.clientId),
    getDocumentData('inventoryItems', sale.productId),
  ])

  const client: ClientRecord = {
    name: stringField(clientData, 'name'),
    document: stringField(clientData, 'document'),
    email: stringField(clientData, 'email'),
    phone: stringField(clientData, 'phone'),
    address: stringField(clientData, 'address'),
    addressNumber: stringField(clientData, 'addressNumber'),
    district: stringField(clientData, 'district'),
    city: stringField(clientData, 'city'),
    state: stringField(clientData, 'state'),
    zipCode: stringField(clientData, 'zipCode'),
    stateRegistration: stringField(clientData, 'stateRegistration'),
    stateRegistrationIndicator: stateRegistrationIndicator(
      stringField(clientData, 'stateRegistrationIndicator'),
    ),
  }

  const product: ProductRecord = {
    sku: stringField(productData, 'sku'),
    unit: stringField(productData, 'unit'),
    ncm: stringField(productData, 'ncm'),
    cfop: stringField(productData, 'cfop'),
    cest: stringField(productData, 'cest'),
    icmsOrigin: stringField(productData, 'icmsOrigin'),
    icmsSituation: stringField(productData, 'icmsSituation'),
    pisSituation: stringField(productData, 'pisSituation'),
    cofinsSituation: stringField(productData, 'cofinsSituation'),
  }

  return {
    referenceType: 'sale',
    referenceId: input.saleId,
    documentType: input.documentType,
    amount: sale.amount,
    description: sale.description,
    soldAt: sale.soldAt,
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
    productCode: product.sku,
    productUnit: product.unit,
    productNcm: product.ncm,
    productCfop: product.cfop,
    productCest: product.cest,
    productIcmsOrigin: product.icmsOrigin,
    productIcmsSituation: product.icmsSituation,
    productPisSituation: product.pisSituation,
    productCofinsSituation: product.cofinsSituation,
    reissue: Boolean(input.reissue),
  }
}

function toFiscalResult(args: {
  request: FiscalInvoiceRequest
  ref: string
  raw: FocusHttpResponse
  focusStatus: number
}) {
  const status = mapFocusStatus(args.raw.status)
  const accessKey =
    args.request.documentType === 'nfce'
      ? args.raw.chave_nfce ?? args.raw.chave_nfe ?? null
      : args.raw.chave_nfe ?? null

  return {
    accepted: args.focusStatus === 201 || args.focusStatus === 202,
    status: args.focusStatus === 201 ? 'authorized' : status,
    message: args.raw.mensagem ?? 'Documento fiscal enviado a Focus NFe.',
    externalId: accessKey,
    protocol: args.raw.protocolo ?? null,
    focusRef: args.ref,
    providerMode: 'live',
    number: args.raw.numero ?? null,
    series: args.raw.serie ?? null,
    accessKey,
    sefazStatus: args.raw.status ?? null,
    xmlUrl: args.raw.caminho_xml_nota_fiscal ?? null,
    pdfUrl: args.raw.caminho_danfe ?? null,
    qrCodeUrl: args.raw.qrcode_url ?? null,
    issuedAt: new Date().toISOString(),
    isSimulated: false,
    environment: env('FOCUS_NFE_ENV', 'homologacao') === 'producao'
      ? 'production'
      : 'homologation',
    rawResponse: args.raw,
  }
}

async function callFocus(args: {
  method: 'GET' | 'POST' | 'DELETE'
  endpoint: 'nfe' | 'nfce'
  ref: string
  token: string
  body?: unknown
}) {
  const url =
    args.method === 'POST'
      ? `${focusBaseUrl()}/v2/${args.endpoint}?ref=${encodeURIComponent(args.ref)}`
      : `${focusBaseUrl()}/v2/${args.endpoint}/${encodeURIComponent(args.ref)}`

  return fetch(url, {
    method: args.method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${args.token}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: args.body ? JSON.stringify(args.body) : undefined,
  })
}

export const focusFiscal = onRequest(
  { region: 'southamerica-east1', secrets: [focusNfeToken], cors: true },
  async (request, response) => {
    if (request.method !== 'POST') {
      response.status(405).json({ message: 'Metodo nao permitido.' })
      return
    }

    try {
      await assertAuthenticated(request)

      const action = request.body as FocusActionRequest
      const token = focusNfeToken.value()
      const endpoint = action.documentType === 'nfce' ? 'nfce' : 'nfe'

      if (action.action === 'status' || action.action === 'cancel') {
        if (!action.focusRef) {
          response.status(400).json({ message: 'Referencia Focus nao informada.' })
          return
        }
        if (action.action === 'cancel') {
          const justification = action.justification?.trim() ?? ''
          if (justification.length < 15 || justification.length > 255) {
            response.status(400).json({
              message: 'Justificativa deve ter entre 15 e 255 caracteres.',
            })
            return
          }
        }

        const focusResponse = await callFocus({
          method: action.action === 'cancel' ? 'DELETE' : 'GET',
          endpoint,
          ref: action.focusRef,
          token,
          body:
            action.action === 'cancel'
              ? { justificativa: action.justification?.trim() }
              : undefined,
        })
        const raw = (await focusResponse.json().catch(() => ({}))) as FocusHttpResponse
        response.status(200).json(
          toFiscalResult({
            request: {
              referenceType: 'sale',
              referenceId: action.saleId,
              documentType: action.documentType,
              amount: 0,
              description: '',
              soldAt: new Date().toISOString(),
              recipientName: '',
              recipientDocument: '',
            },
            ref: action.focusRef,
            raw,
            focusStatus: focusResponse.status,
          }),
        )
        return
      }

      const payload = await buildFiscalRequest(action)

      const issues = validatePayload(payload)
      if (issues.length > 0) {
        response.status(422).json({
          accepted: false,
          status: 'fiscal_configuration_incomplete',
          message: `Configuracao fiscal incompleta: ${issues.join('; ')}.`,
          externalId: null,
          protocol: null,
          focusRef: '',
          providerMode: 'live',
        })
        return
      }

      const ref = focusRef(payload.referenceId, payload.documentType, Boolean(payload.reissue))
      const body = mapSaleToFocusPayload(payload)
      const lockRef = firestore.collection('fiscalEmissionLocks').doc(ref)
      const lockCreated = await firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(lockRef)
        if (snapshot.exists) return false
        transaction.set(lockRef, {
          focusRef: ref,
          saleId: payload.referenceId,
          documentType: payload.documentType,
          status: 'processing',
          createdAt: new Date().toISOString(),
        })
        return true
      })

      if (!lockCreated) {
        response.status(409).json({
          accepted: false,
          status: 'processing',
          message:
            'Emissao fiscal ja solicitada para esta referencia. Consulte a situacao antes de reenviar.',
          externalId: null,
          protocol: null,
          focusRef: ref,
          providerMode: 'live',
        })
        return
      }

      const focusResponse = await callFocus({
        method: 'POST',
        endpoint,
        ref,
        token,
        body,
      })

      const raw = (await focusResponse.json().catch(() => ({}))) as FocusHttpResponse
      const result = toFiscalResult({
        request: payload,
        ref,
        raw,
        focusStatus: focusResponse.status,
      })

      if (result.accepted) {
        await lockRef.set(
          {
            status: result.status,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        )
        response.status(200).json(result)
        return
      }

      await lockRef.set(
        {
          status: focusResponse.status === 401 ? 'error' : 'rejected',
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      )
      response.status(200).json({
        ...result,
        accepted: false,
        status: focusResponse.status === 401 ? 'error' : 'rejected',
        message:
          raw.mensagem ??
          `Focus NFe retornou HTTP ${focusResponse.status}. Verifique token/certificado/payload.`,
      })
    } catch (error) {
      const message =
        error instanceof Error && error.message === 'unauthenticated'
          ? 'Usuario nao autenticado.'
          : error instanceof Error
            ? error.message
            : 'Falha fiscal no backend.'

      response.status(message === 'Usuario nao autenticado.' ? 401 : 500).json({
        accepted: false,
        status: 'error',
        message,
        externalId: null,
        protocol: null,
        focusRef: '',
        providerMode: 'live',
      })
    }
  },
)
