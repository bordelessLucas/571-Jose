import type {
  FiscalDocument,
  FiscalInvoiceRequest,
  FiscalInvoiceResult,
} from '@/domain/types'
import { AppError } from '@/lib/errors'
import type { FiscalEmitterPort } from '@/services/fiscal/fiscal.port'
import { FocusNfeHttpAdapter } from '@/services/fiscal/focusNfe.http.adapter'

export type { FiscalEmitterPort } from '@/services/fiscal/fiscal.port'

function validateRequest(payload: FiscalInvoiceRequest): void {
  if (payload.referenceType !== 'sale') {
    throw new AppError(
      'validation',
      'Somente venda dispara emissao fiscal nesta versao.',
    )
  }
  if (!payload.referenceId) {
    throw new AppError('validation', 'Referencia da venda e obrigatoria.')
  }
  if (!(payload.amount > 0)) {
    throw new AppError('validation', 'Valor da emissao deve ser maior que zero.')
  }
  if (!payload.recipientName.trim()) {
    throw new AppError('validation', 'Nome do destinatario e obrigatorio.')
  }

}

function createDefaultEmitter(): FiscalEmitterPort {
  return new FocusNfeHttpAdapter()
}

let activeEmitter: FiscalEmitterPort = createDefaultEmitter()

export function getFiscalEmitter(): FiscalEmitterPort {
  return activeEmitter
}

export function setFiscalEmitter(emitter: FiscalEmitterPort): void {
  activeEmitter = emitter
}

export function resetFiscalEmitterFromEnv(): void {
  activeEmitter = createDefaultEmitter()
}

export async function prepareFiscalEmission(
  payload: FiscalInvoiceRequest,
): Promise<FiscalInvoiceResult> {
  validateRequest(payload)
  return activeEmitter.requestInvoice(payload)
}

export async function consultFiscalDocument(
  document: FiscalDocument,
): Promise<FiscalInvoiceResult> {
  if (!activeEmitter.getStatus) {
    throw new AppError('validation', 'Consulta fiscal indisponivel neste modo.')
  }
  return activeEmitter.getStatus(document)
}

export async function cancelFiscalDocument(
  document: FiscalDocument,
  justification: string,
): Promise<FiscalInvoiceResult> {
  if (document.status !== 'authorized') {
    throw new AppError('validation', 'Somente documento autorizado pode ser cancelado.')
  }
  if (justification.trim().length < 15 || justification.trim().length > 255) {
    throw new AppError(
      'validation',
      'Justificativa deve ter entre 15 e 255 caracteres.',
    )
  }
  if (!activeEmitter.cancel) {
    throw new AppError('validation', 'Cancelamento fiscal indisponivel neste modo.')
  }
  return activeEmitter.cancel(document, justification.trim())
}
