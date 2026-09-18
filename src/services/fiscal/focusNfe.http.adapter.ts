import type { FiscalInvoiceRequest, FiscalInvoiceResult } from '@/domain/types'
import { getAuth } from 'firebase/auth'
import type { FiscalEmitterPort } from '@/services/fiscal/fiscal.port'
import { getFocusNfeProxyUrl } from '@/services/fiscal/focusNfe.config'
import { buildFocusRef } from '@/services/fiscal/focusNfe.mapper'

type ProxyErrorResponse = {
  message?: string
}

/** Adapter HTTP real via Cloud Function, mantendo o token Focus no servidor. */
export class FocusNfeHttpAdapter implements FiscalEmitterPort {
  async requestInvoice(payload: FiscalInvoiceRequest): Promise<FiscalInvoiceResult> {
    const focusRef = buildFocusRef(payload.referenceId, Boolean(payload.reissue))
    const currentUser = getAuth().currentUser

    if (!currentUser) {
      return {
        accepted: false,
        status: 'error',
        message: 'Usuario nao autenticado para emitir NF-e.',
        externalId: null,
        protocol: null,
        focusRef,
        providerMode: 'live',
      }
    }

    try {
      const idToken = await currentUser.getIdToken()
      const response = await fetch(getFocusNfeProxyUrl(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const raw = (await response.json().catch(() => ({}))) as
        | FiscalInvoiceResult
        | ProxyErrorResponse

      if (response.ok && 'focusRef' in raw) {
        return {
          ...raw,
          focusRef: raw.focusRef || focusRef,
        }
      }

      return {
        accepted: false,
        status: 'error',
        message:
          'message' in raw && raw.message
            ? raw.message
            : `Proxy Focus NFe retornou HTTP ${response.status}.`,
        externalId: null,
        protocol: null,
        focusRef,
        providerMode: 'live',
        rawResponse: raw,
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Falha de rede ao chamar proxy Focus NFe.'

      return {
        accepted: false,
        status: 'error',
        message,
        externalId: null,
        protocol: null,
        focusRef,
        providerMode: 'live',
      }
    }
  }
}
