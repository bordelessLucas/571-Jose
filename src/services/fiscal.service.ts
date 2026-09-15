import type { FiscalInvoiceRequest, FiscalInvoiceResult } from '@/domain/types'
import { AppError } from '@/lib/errors'

/**
 * Porta fiscal desacoplada.
 * Não implementa regras NF-e/NFS-e — apenas prepara o contrato para API externa.
 */
export interface FiscalEmitterPort {
  requestInvoice(payload: FiscalInvoiceRequest): Promise<FiscalInvoiceResult>
}

class StubFiscalEmitter implements FiscalEmitterPort {
  async requestInvoice(payload: FiscalInvoiceRequest): Promise<FiscalInvoiceResult> {
    if (!payload.referenceId || !(payload.amount > 0)) {
      throw new AppError(
        'validation',
        'Dados insuficientes para preparar emissão fiscal.',
      )
    }

    return {
      accepted: false,
      message:
        'Emissor fiscal ainda não integrado. Estrutura pronta para API NF-e/NFS-e.',
      externalId: null,
    }
  }
}

export const fiscalEmitter: FiscalEmitterPort = new StubFiscalEmitter()

export async function prepareFiscalEmission(
  payload: FiscalInvoiceRequest,
): Promise<FiscalInvoiceResult> {
  return fiscalEmitter.requestInvoice(payload)
}
