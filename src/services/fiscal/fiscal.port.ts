import type {
  FiscalDocument,
  FiscalInvoiceRequest,
  FiscalInvoiceResult,
} from '@/domain/types'

export interface FiscalEmitterPort {
  requestInvoice(payload: FiscalInvoiceRequest): Promise<FiscalInvoiceResult>
  getStatus?(document: FiscalDocument): Promise<FiscalInvoiceResult>
  cancel?(document: FiscalDocument, justification: string): Promise<FiscalInvoiceResult>
}
