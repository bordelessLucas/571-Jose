import type { FiscalInvoiceRequest, FiscalInvoiceResult } from '@/domain/types'
import type { FiscalEmitterPort } from '@/services/fiscal/fiscal.port'
import { buildFocusRef, mapSaleToFocusNfePayload } from '@/services/fiscal/focusNfe.mapper'

/**
 * Adapter mock da Focus NFe.
 * Simula autorização assíncrona (queued → authorized) sem chamar a API real.
 * Ideal enquanto não há certificado / token definitivo.
 */
export class FocusNfeMockAdapter implements FiscalEmitterPort {
  async requestInvoice(payload: FiscalInvoiceRequest): Promise<FiscalInvoiceResult> {
    const focusRef = buildFocusRef(payload.referenceId)
    const mapped = mapSaleToFocusNfePayload(payload)

    // Valida payload mínimo (espelha rejeição da Focus)
    if (!mapped.cnpj_emitente || mapped.cnpj_emitente.length < 14) {
      return {
        accepted: false,
        status: 'rejected',
        message: 'Mock Focus: CNPJ emitente inválido no template.',
        externalId: null,
        protocol: null,
        focusRef,
        providerMode: 'mock',
        rawResponse: { erro: 'cnpj_emitente_invalido' },
      }
    }

    const protocol = `MOCK-${Date.now()}`
    const externalId = `NFe${protocol}`

    return {
      accepted: true,
      status: 'authorized',
      message: 'Mock Focus NFe: NF-e autorizada em homologação simulada.',
      externalId,
      protocol,
      focusRef,
      providerMode: 'mock',
      rawResponse: {
        status: 'autorizado',
        ref: focusRef,
        protocolo: protocol,
        chave_nfe: externalId,
        modo: 'mock',
        payload_enviado: mapped,
      },
    }
  }
}
