import type {
  FiscalDocument,
  FiscalInvoiceRequest,
  FiscalInvoiceResult,
} from '@/domain/types'
import { getAuth } from 'firebase/auth'
import type { FiscalEmitterPort } from '@/services/fiscal/fiscal.port'
import { getFocusNfeProxyUrl } from '@/services/fiscal/focusNfe.config'
import { buildFocusRef } from '@/services/fiscal/focusNfe.mapper'

type ProxyErrorResponse = {
  message?: string
  mensagem?: string
  error?: string
}

function hasFiscalResultShape(raw: unknown): raw is FiscalInvoiceResult {
  return (
    raw !== null &&
    typeof raw === 'object' &&
    'status' in raw &&
    ('focusRef' in raw || 'message' in raw)
  )
}

function responseMessage(
  raw: FiscalInvoiceResult | ProxyErrorResponse,
  httpStatus: number,
): string {
  if ('message' in raw && raw.message) return raw.message
  if ('mensagem' in raw && raw.mensagem) return raw.mensagem
  if ('error' in raw && raw.error) return raw.error
  return `Proxy Focus NFe respondeu HTTP ${httpStatus}, mas nao retornou uma mensagem fiscal detalhada. Consulte a aba Fiscal ou a Focus pela referencia.`
}

/** Adapter HTTP real via Cloud Function, mantendo o token Focus no servidor. */
export class FocusNfeHttpAdapter implements FiscalEmitterPort {
  private async postProxy(
    body: Record<string, unknown>,
    fallbackRef: string,
  ): Promise<FiscalInvoiceResult> {
    const currentUser = getAuth().currentUser

    if (!currentUser) {
      return {
        accepted: false,
        status: 'error',
        message: 'Usuario nao autenticado para operar documento fiscal.',
        externalId: null,
        protocol: null,
        focusRef: fallbackRef,
        providerMode: 'live',
      }
    }

    try {
      const idToken = await currentUser.getIdToken()
      const response = await fetch(`${getFocusNfeProxyUrl()}/emit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const raw = (await response.json().catch(() => ({}))) as
        | FiscalInvoiceResult
        | ProxyErrorResponse

      if (hasFiscalResultShape(raw)) {
        return {
          ...raw,
          accepted: Boolean(raw.accepted),
          message: responseMessage(raw, response.status),
          externalId: raw.externalId ?? null,
          protocol: raw.protocol ?? null,
          focusRef: raw.focusRef || fallbackRef,
          providerMode: 'live',
          rawResponse: raw.rawResponse ?? raw,
        }
      }

      return {
        accepted: false,
        status: 'error',
        message: responseMessage(raw, response.status),
        externalId: null,
        protocol: null,
        focusRef: fallbackRef,
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
        focusRef: fallbackRef,
        providerMode: 'live',
      }
    }
  }

  async requestInvoice(payload: FiscalInvoiceRequest): Promise<FiscalInvoiceResult> {
    const focusRef = buildFocusRef(
      payload.referenceId,
      payload.documentType,
      Boolean(payload.reissue),
    )
    return this.postProxy(
      {
        action: 'emit',
        saleId: payload.referenceId,
        documentType: payload.documentType,
        reissue: Boolean(payload.reissue),
      },
      focusRef,
    )
  }

  async getStatus(document: FiscalDocument): Promise<FiscalInvoiceResult> {
    return this.postProxy(
      {
        action: 'status',
        saleId: document.referenceId,
        documentType: document.documentType,
        focusRef: document.focusRef,
      },
      document.focusRef,
    )
  }

  async cancel(
    document: FiscalDocument,
    justification: string,
  ): Promise<FiscalInvoiceResult> {
    return this.postProxy(
      {
        action: 'cancel',
        saleId: document.referenceId,
        documentType: document.documentType,
        focusRef: document.focusRef,
        justification,
      },
      document.focusRef,
    )
  }
}
