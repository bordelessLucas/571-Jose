import type { FiscalInvoiceRequest } from '@/domain/types'
import { getEmitenteConfig } from '@/services/fiscal/focusNfe.config'

/** Payload mínimo alinhado à API Focus NFe /v2/nfe (NF-e 4.00). */
export type FocusNfePayload = {
  natureza_operacao: string
  data_emissao: string
  tipo_documento: '1'
  local_destino: '1'
  finalidade_emissao: '1'
  consumidor_final: '1'
  presenca_comprador: '9'
  cnpj_emitente: string
  nome_emitente: string
  nome_fantasia_emitente: string
  logradouro_emitente: string
  numero_emitente: string
  bairro_emitente: string
  municipio_emitente: string
  uf_emitente: string
  cep_emitente: string
  inscricao_estadual_emitente: string
  regime_tributario_emitente: string
  nome_destinatario: string
  cpf_destinatario?: string
  cnpj_destinatario?: string
  indicador_inscricao_estadual_destinatario: '1' | '2' | '9'
  inscricao_estadual_destinatario?: string
  logradouro_destinatario: string
  numero_destinatario: string
  bairro_destinatario: string
  municipio_destinatario: string
  uf_destinatario: string
  cep_destinatario: string
  pais_destinatario: string
  telefone_destinatario?: string
  modalidade_frete: '9'
  items: Array<{
    numero_item: string
    codigo_produto: string
    descricao: string
    cfop: string
    unidade_comercial: string
    quantidade_comercial: string
    valor_unitario_comercial: string
    valor_unitario_tributavel: string
    unidade_tributavel: string
    codigo_ncm: string
    quantidade_tributavel: string
    valor_bruto: string
    icms_origem: string
    icms_situacao_tributaria: string
  }>
}

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

/**
 * Mapeia a venda do domínio para o contrato Focus NFe.
 * Campos fiscais avançados (CFOP/NCM/CST) usam defaults de template
 * até o cliente definir o perfil tributário.
 */
export function mapSaleToFocusNfePayload(
  request: FiscalInvoiceRequest,
): FocusNfePayload {
  const emitente = getEmitenteConfig()
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
    cnpj_emitente: onlyDigits(emitente.cnpj),
    nome_emitente: emitente.nome,
    nome_fantasia_emitente: emitente.nomeFantasia,
    logradouro_emitente: emitente.logradouro,
    numero_emitente: emitente.numero,
    bairro_emitente: emitente.bairro,
    municipio_emitente: emitente.municipio,
    uf_emitente: emitente.uf,
    cep_emitente: onlyDigits(emitente.cep),
    inscricao_estadual_emitente: emitente.inscricaoEstadual,
    regime_tributario_emitente: emitente.regimeTributario,
    nome_destinatario: request.recipientName,
    ...(isCnpj ? { cnpj_destinatario: doc } : { cpf_destinatario: doc || '00000000000' }),
    indicador_inscricao_estadual_destinatario:
      request.recipientStateRegistrationIndicator ?? '9',
    inscricao_estadual_destinatario:
      request.recipientStateRegistration || undefined,
    logradouro_destinatario: request.recipientAddress || 'Nao informado',
    numero_destinatario: request.recipientAddressNumber || 'S/N',
    bairro_destinatario: request.recipientDistrict || 'Centro',
    municipio_destinatario: request.recipientCity || emitente.municipio,
    uf_destinatario: request.recipientState || emitente.uf,
    cep_destinatario: onlyDigits(request.recipientZipCode || emitente.cep),
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
        codigo_ncm: onlyDigits(request.productNcm || '00000000'),
        quantidade_tributavel: '1.0000',
        valor_bruto: amount,
        icms_origem: request.productIcmsOrigin || '0',
        icms_situacao_tributaria: request.productIcmsSituation || '102',
      },
    ],
  }
}

export function buildFocusRef(saleId: string, reissue = false): string {
  if (!reissue) {
    return `sale-${saleId}`
  }
  return `sale-${saleId}-r${Date.now()}`
}
