import type { FiscalDocumentType, FiscalInvoiceRequest } from '@/domain/types'
import {
  getEmitenteConfig,
  getFocusNfeEnvironment,
} from '@/services/fiscal/focusNfe.config'

export type FocusPayload = Record<string, unknown>

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function toFocusDate(isoDate: string): string {
  if (isoDate.includes('T')) return isoDate
  return `${isoDate}T12:00:00-03:00`
}

function formatMoney(value: number): string {
  return value.toFixed(2)
}

function missing(label: string, value: string | undefined): string[] {
  return value && value.trim().length > 0 ? [] : [label]
}

function validateCompany(documentType: FiscalDocumentType): string[] {
  const emitente = getEmitenteConfig()
  const issues = [
    ...missing('CNPJ do emitente ausente', emitente.cnpj),
    ...missing('nome do emitente ausente', emitente.nome),
    ...missing('logradouro do emitente ausente', emitente.logradouro),
    ...missing('numero do emitente ausente', emitente.numero),
    ...missing('bairro do emitente ausente', emitente.bairro),
    ...missing('municipio do emitente ausente', emitente.municipio),
    ...missing('UF do emitente ausente', emitente.uf),
    ...missing('CEP do emitente ausente', emitente.cep),
    ...missing('inscricao estadual do emitente ausente', emitente.inscricaoEstadual),
    ...missing('regime tributario do emitente ausente', emitente.regimeTributario),
  ]

  if (documentType === 'nfe') {
    issues.push(...missing('serie NF-e ausente', emitente.serieNfe))
  }

  if (documentType === 'nfce') {
    issues.push(...missing('serie NFC-e ausente', emitente.serieNfce))
    if (getFocusNfeEnvironment() === 'producao') {
      issues.push(...missing('CSC NFC-e ausente', emitente.cscNfce))
      issues.push(...missing('ID CSC NFC-e ausente', emitente.idCscNfce))
    }
  }

  return issues
}

export function validateFiscalEmission(request: FiscalInvoiceRequest): string[] {
  const issues = [
    ...validateCompany(request.documentType),
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

  if (!(request.amount > 0)) {
    issues.push('valor da emissao deve ser maior que zero')
  }

  return issues
}

export function mapSaleToFocusPayload(request: FiscalInvoiceRequest): FocusPayload {
  const emitente = getEmitenteConfig()
  const doc = onlyDigits(request.recipientDocument)
  const amount = formatMoney(request.amount)
  const isCnpj = doc.length > 11
  const serie =
    request.documentType === 'nfce' ? emitente.serieNfce : emitente.serieNfe

  return {
    natureza_operacao: 'Venda de mercadoria',
    data_emissao: toFocusDate(request.soldAt),
    tipo_documento: '1',
    local_destino: '1',
    finalidade_emissao: '1',
    consumidor_final: '1',
    presenca_comprador: request.documentType === 'nfce' ? '1' : '9',
    serie,
    cnpj_emitente: onlyDigits(emitente.cnpj),
    nome_emitente: emitente.nome,
    nome_fantasia_emitente: emitente.nomeFantasia || emitente.nome,
    logradouro_emitente: emitente.logradouro,
    numero_emitente: emitente.numero,
    bairro_emitente: emitente.bairro,
    municipio_emitente: emitente.municipio,
    uf_emitente: emitente.uf,
    cep_emitente: onlyDigits(emitente.cep),
    inscricao_estadual_emitente: emitente.inscricaoEstadual,
    regime_tributario_emitente: emitente.regimeTributario,
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

export function buildFocusRef(
  saleId: string,
  documentType: FiscalDocumentType,
  reissue = false,
): string {
  const prefix = documentType === 'nfce' ? 'sale-nfce' : 'sale-nfe'
  if (!reissue) {
    return `${prefix}-${saleId}`
  }
  return `${prefix}-${saleId}-r${Date.now()}`
}
