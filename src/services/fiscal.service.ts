import type {
  FiscalInvoiceRequest,
  FiscalInvoiceResult,
} from '@/domain/types'
import { AppError } from '@/lib/errors'
import type { FiscalEmitterPort } from '@/services/fiscal/fiscal.port'
import { getFocusNfeMode } from '@/services/fiscal/focusNfe.config'
import { FocusNfeHttpAdapter } from '@/services/fiscal/focusNfe.http.adapter'
import { FocusNfeMockAdapter } from '@/services/fiscal/focusNfe.mock.adapter'

export type { FiscalEmitterPort } from '@/services/fiscal/fiscal.port'

function validateRequest(payload: FiscalInvoiceRequest): void {
  if (payload.referenceType !== 'sale') {
    throw new AppError(
      'validation',
      'Somente venda dispara NF-e automática nesta versão.',
    )
  }
  if (!payload.referenceId) {
    throw new AppError('validation', 'Referência da venda é obrigatória.')
  }
  if (!(payload.amount > 0)) {
    throw new AppError('validation', 'Valor da emissão deve ser maior que zero.')
  }
  if (!payload.recipientName.trim()) {
    throw new AppError('validation', 'Nome do destinatário é obrigatório.')
  }
}

function createDefaultEmitter(): FiscalEmitterPort {
  return getFocusNfeMode() === 'live'
    ? new FocusNfeHttpAdapter()
    : new FocusNfeMockAdapter()
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
