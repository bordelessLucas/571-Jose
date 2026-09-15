import type {
  FiscalDocumentStatus,
  FiscalInvoiceRequest,
  FiscalInvoiceResult,
} from '@/domain/types'
import { AppError } from '@/lib/errors'

/**
 * Porta fiscal desacoplada.
 * Não implementa regras NF-e/NFS-e — contrato pronto para API externa.
 */
export interface FiscalEmitterPort {
  requestInvoice(payload: FiscalInvoiceRequest): Promise<FiscalInvoiceResult>
  getStatus?(externalId: string): Promise<FiscalDocumentStatus>
}

function validateRequest(payload: FiscalInvoiceRequest): void {
  if (!payload.referenceId) {
    throw new AppError('validation', 'Referência do documento é obrigatória.')
  }
  if (!(payload.amount > 0)) {
    throw new AppError('validation', 'Valor da emissão deve ser maior que zero.')
  }
  if (!payload.documentType) {
    throw new AppError('validation', 'Tipo de documento fiscal é obrigatório.')
  }
}

class StubFiscalEmitter implements FiscalEmitterPort {
  async requestInvoice(payload: FiscalInvoiceRequest): Promise<FiscalInvoiceResult> {
    validateRequest(payload)

    return {
      accepted: false,
      status: 'draft',
      message:
        'Emissor fiscal ainda não integrado. Modelagem pronta para API NF-e/NFS-e.',
      externalId: null,
      protocol: null,
    }
  }

  async getStatus(): Promise<FiscalDocumentStatus> {
    return 'draft'
  }
}

let activeEmitter: FiscalEmitterPort = new StubFiscalEmitter()

export function getFiscalEmitter(): FiscalEmitterPort {
  return activeEmitter
}

/** Troca o stub pela implementação real da API fiscal quando disponível. */
export function setFiscalEmitter(emitter: FiscalEmitterPort): void {
  activeEmitter = emitter
}

export async function prepareFiscalEmission(
  payload: FiscalInvoiceRequest,
): Promise<FiscalInvoiceResult> {
  return activeEmitter.requestInvoice(payload)
}
