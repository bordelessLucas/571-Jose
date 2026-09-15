import type {
  FiscalDocumentStatus,
  FiscalInvoiceRequest,
  FiscalInvoiceResult,
} from '@/domain/types'

export interface FiscalEmitterPort {
  requestInvoice(payload: FiscalInvoiceRequest): Promise<FiscalInvoiceResult>
  getStatus?(externalId: string): Promise<FiscalDocumentStatus>
}
