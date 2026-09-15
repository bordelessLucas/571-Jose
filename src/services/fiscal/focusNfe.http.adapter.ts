import type { FiscalInvoiceRequest, FiscalInvoiceResult } from '@/domain/types'
import type { FiscalEmitterPort } from '@/services/fiscal/fiscal.port'
import {
  getFocusNfeBaseUrl,
  getFocusNfeToken,
  isFocusTokenTemplate,
} from '@/services/fiscal/focusNfe.config'
import { buildFocusRef, mapSaleToFocusNfePayload } from '@/services/fiscal/focusNfe.mapper'

type FocusHttpResponse = {
  status?: string
  mensagem?: string
  protocolo?: string
  chave_nfe?: string
  caminho_xml_nota_fiscal?: string
  erros?: unknown
}

function mapFocusStatus(status: string | undefined): FiscalInvoiceResult['status'] {
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

/**
 * Adapter HTTP real da Focus NFe.
 * Atenção: chamada direta do browser pode falhar por CORS.
 * Em produção, preferir Cloud Function como proxy com o token no servidor.
 */
export class FocusNfeHttpAdapter implements FiscalEmitterPort {
  async requestInvoice(payload: FiscalInvoiceRequest): Promise<FiscalInvoiceResult> {
    const token = getFocusNfeToken()
    const focusRef = buildFocusRef(payload.referenceId)

    if (isFocusTokenTemplate(token)) {
      return {
        accepted: false,
        status: 'error',
        message:
          'Token Focus NFe ainda é o template. Defina VITE_FOCUS_NFE_TOKEN ou use mode=mock.',
        externalId: null,
        protocol: null,
        focusRef,
        providerMode: 'live',
      }
    }

    const body = mapSaleToFocusNfePayload(payload)
    const url = `${getFocusNfeBaseUrl()}/v2/nfe?ref=${encodeURIComponent(focusRef)}`
    const auth = btoa(`${token}:`)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const raw = (await response.json().catch(() => ({}))) as FocusHttpResponse
      const status = mapFocusStatus(raw.status)

      if (response.status === 201 || response.status === 202) {
        return {
          accepted: true,
          status: response.status === 201 ? 'authorized' : status,
          message: raw.mensagem ?? 'NF-e enviada à Focus NFe.',
          externalId: raw.chave_nfe ?? null,
          protocol: raw.protocolo ?? null,
          focusRef,
          providerMode: 'live',
          rawResponse: raw,
        }
      }

      return {
        accepted: false,
        status: response.status === 401 ? 'error' : 'rejected',
        message:
          raw.mensagem ??
          `Focus NFe retornou HTTP ${response.status}. Verifique token/certificado/payload.`,
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
          : 'Falha de rede ao chamar Focus NFe (possível CORS — use proxy/Cloud Function).'

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
