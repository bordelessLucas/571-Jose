import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'

initializeApp()

const focusNfeToken = defineSecret('FOCUS_NFE_TOKEN')

type FocusNfeEnvironment = 'homologacao' | 'producao'

type FiscalInvoiceRequest = {
  referenceType: 'sale'
  referenceId: string
  documentType: 'nfe'
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
  productIcmsOrigin?: string
  productIcmsSituation?: string
  reissue?: boolean
}

type FocusHttpResponse = {
  status?: string
  mensagem?: string
  protocolo?: string
  chave_nfe?: string
  erros?: unknown
}

function env(key: string, fallback = ''): string {
  const value = process.env[key]
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function focusRef(saleId: string, reissue = false): string {
  return reissue ? `sale-${saleId}-r${Date.now()}` : `sale-${saleId}`
}

function focusBaseUrl(): string {
  const environment = env('FOCUS_NFE_ENV', 'homologacao') as FocusNfeEnvironment
  return environment === 'producao'
    ? 'https://api.focusnfe.com.br'
    : 'https://homologacao.focusnfe.com.br'
}

function toFocusDate(isoDate: string): string {
  return isoDate.includes('T') ? isoDate : `${isoDate}T12:00:00-03:00`
}

function formatMoney(value: number): string {
  return value.toFixed(2)
}

function mapFocusStatus(status: string | undefined) {
  switch ((status ?? '').toLowerCase()) {
    case 'autorizado':
      return 'authorized'
    case 'erro_autorizacao':
    case 'denegado':
      return 'rejected'
    case 'cancelado':
      return 'cancelled'
    case 'processando_autorizacao':
      return 'queued'
    default:
      return 'queued'
  }
}

function mapSaleToFocusNfePayload(request: FiscalInvoiceRequest) {
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
    presenca_comprador: '9',
    cnpj_emitente: onlyDigits(env('EMITENTE_CNPJ')),
    nome_emitente: env('EMITENTE_NOME'),
    nome_fantasia_emitente: env('EMITENTE_NOME_FANTASIA', env('EMITENTE_NOME')),
    logradouro_emitente: env('EMITENTE_LOGRADOURO'),
    numero_emitente: env('EMITENTE_NUMERO'),
    bairro_emitente: env('EMITENTE_BAIRRO'),
    municipio_emitente: env('EMITENTE_MUNICIPIO'),
    uf_emitente: env('EMITENTE_UF'),
    cep_emitente: onlyDigits(env('EMITENTE_CEP')),
    inscricao_estadual_emitente: env('EMITENTE_IE', 'ISENTO'),
    regime_tributario_emitente: env('EMITENTE_REGIME', '1'),
    nome_destinatario: request.recipientName,
    ...(isCnpj ? { cnpj_destinatario: doc } : { cpf_destinatario: doc || '00000000000' }),
    indicador_inscricao_estadual_destinatario:
      request.recipientStateRegistrationIndicator ?? '9',
    inscricao_estadual_destinatario: request.recipientStateRegistration || undefined,
    logradouro_destinatario: request.recipientAddress || 'Nao informado',
    numero_destinatario: request.recipientAddressNumber || 'S/N',
    bairro_destinatario: request.recipientDistrict || 'Centro',
    municipio_destinatario: request.recipientCity || env('EMITENTE_MUNICIPIO'),
    uf_destinatario: request.recipientState || env('EMITENTE_UF'),
    cep_destinatario: onlyDigits(request.recipientZipCode || env('EMITENTE_CEP')),
    pais_destinatario: 'Brasil',
    telefone_destinatario: request.recipientPhone
      ? onlyDigits(request.recipientPhone)
      : undefined,
    modalidade_frete: '9',
    items: [
      {
        numero_item: '1',
        codigo_produto: request.productCode || request.referenceId.slice(0, 12),
        descricao: request.description || 'Venda comercial',
        cfop: request.productCfop || '5102',
        unidade_comercial: request.productUnit || 'UN',
        quantidade_comercial: '1.0000',
        valor_unitario_comercial: amount,
        valor_unitario_tributavel: amount,
        unidade_tributavel: request.productUnit || 'UN',
        codigo_ncm: onlyDigits(
          request.productNcm || env('FOCUS_NFE_DEFAULT_NCM', '00000000'),
        ),
        quantidade_tributavel: '1.0000',
        valor_bruto: amount,
        icms_origem: request.productIcmsOrigin || '0',
        icms_situacao_tributaria: request.productIcmsSituation || '102',
      },
    ],
  }
}

async function assertAuthenticated(request: Parameters<Parameters<typeof onRequest>[0]>[0]) {
  const header = request.header('authorization') ?? ''
  const match = header.match(/^Bearer (.+)$/)

  if (!match) {
    throw new Error('unauthenticated')
  }

  await getAuth().verifyIdToken(match[1])
}

export const emitNfe = onRequest(
  { region: 'southamerica-east1', secrets: [focusNfeToken], cors: true },
  async (request, response) => {
    if (request.method !== 'POST') {
      response.status(405).json({ message: 'Metodo nao permitido.' })
      return
    }

    try {
      await assertAuthenticated(request)

      const payload = request.body as FiscalInvoiceRequest
      const ref = focusRef(payload.referenceId, Boolean(payload.reissue))
      const body = mapSaleToFocusNfePayload(payload)
      const token = focusNfeToken.value()
      const url = `${focusBaseUrl()}/v2/nfe?ref=${encodeURIComponent(ref)}`

      const focusResponse = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${token}:`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const raw = (await focusResponse.json().catch(() => ({}))) as FocusHttpResponse
      const status = mapFocusStatus(raw.status)

      if (focusResponse.status === 201 || focusResponse.status === 202) {
        response.status(200).json({
          accepted: true,
          status: focusResponse.status === 201 ? 'authorized' : status,
          message: raw.mensagem ?? 'NF-e enviada a Focus NFe.',
          externalId: raw.chave_nfe ?? null,
          protocol: raw.protocolo ?? null,
          focusRef: ref,
          providerMode: 'live',
          rawResponse: raw,
        })
        return
      }

      response.status(200).json({
        accepted: false,
        status: focusResponse.status === 401 ? 'error' : 'rejected',
        message:
          raw.mensagem ??
          `Focus NFe retornou HTTP ${focusResponse.status}. Verifique token/certificado/payload.`,
        externalId: null,
        protocol: null,
        focusRef: ref,
        providerMode: 'live',
        rawResponse: raw,
      })
    } catch (error) {
      const message =
        error instanceof Error && error.message === 'unauthenticated'
          ? 'Usuario nao autenticado.'
          : error instanceof Error
            ? error.message
            : 'Falha ao emitir NF-e.'

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
