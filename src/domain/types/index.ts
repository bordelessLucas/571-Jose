export type UserProfile = {
  uid: string
  email: string
  displayName: string | null
}

export type Client = {
  id: string
  name: string
  email: string
  phone: string
  document: string
  notes: string
  createdAt: string
  updatedAt: string
}

export type ClientInput = {
  name: string
  email: string
  phone: string
  document: string
  notes: string
}

export type Seller = {
  id: string
  name: string
  email: string
  phone: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export type SellerInput = {
  name: string
  email: string
  phone: string
  active: boolean
}

export type Sale = {
  id: string
  clientId: string
  clientName: string
  sellerId: string
  sellerName: string
  amount: number
  description: string
  soldAt: string
  createdAt: string
  updatedAt: string
}

export type SaleInput = {
  clientId: string
  sellerId: string
  amount: number
  description: string
  soldAt: string
}

export type ExpenseCategory =
  | 'operacional'
  | 'administrativa'
  | 'comercial'
  | 'financeira'
  | 'outra'

export type Expense = {
  id: string
  description: string
  category: ExpenseCategory
  amount: number
  expenseDate: string
  createdAt: string
  updatedAt: string
}

export type ExpenseInput = {
  description: string
  category: ExpenseCategory
  amount: number
  expenseDate: string
}

export type FinancialStatus = 'pendente' | 'pago' | 'cancelado'

export type AccountPayable = {
  id: string
  description: string
  amount: number
  dueDate: string
  status: FinancialStatus
  createdAt: string
  updatedAt: string
}

export type AccountPayableInput = {
  description: string
  amount: number
  dueDate: string
  status: FinancialStatus
}

export type AccountReceivable = {
  id: string
  description: string
  amount: number
  dueDate: string
  status: FinancialStatus
  createdAt: string
  updatedAt: string
}

export type AccountReceivableInput = {
  description: string
  amount: number
  dueDate: string
  status: FinancialStatus
}

export type CashMovementType = 'entrada' | 'saida'

export type CashMovement = {
  id: string
  type: CashMovementType
  description: string
  amount: number
  movementDate: string
  createdAt: string
  updatedAt: string
}

export type CashMovementInput = {
  type: CashMovementType
  description: string
  amount: number
  movementDate: string
}

export type CashBalanceSummary = {
  entradas: number
  saidas: number
  saldo: number
  movementsCount: number
}

export type InventoryItem = {
  id: string
  name: string
  sku: string
  quantity: number
  unit: string
  notes: string
  createdAt: string
  updatedAt: string
}

export type InventoryItemInput = {
  name: string
  sku: string
  quantity: number
  unit: string
  notes: string
}

export type DrePeriodFilter = {
  from: string
  to: string
}

export type DreSummary = {
  receitas: number
  despesas: number
  resultado: number
  salesCount: number
  expensesCount: number
  period: DrePeriodFilter | null
}

/** Tipos de documento fiscal suportados na modelagem (emissão futura). */
export type FiscalDocumentType = 'nfe' | 'nfse'

export type FiscalDocumentStatus =
  | 'draft'
  | 'queued'
  | 'authorized'
  | 'rejected'
  | 'cancelled'

/**
 * Contrato de emissão desacoplado.
 * A integração real com API fiscal virá após o CRUD estar estável.
 */
export type FiscalInvoiceRequest = {
  referenceType: 'sale' | 'expense' | 'account_receivable'
  referenceId: string
  documentType: FiscalDocumentType
  amount: number
  description: string
  recipientDocument?: string
  recipientName?: string
}

export type FiscalInvoiceResult = {
  accepted: boolean
  status: FiscalDocumentStatus
  message: string
  externalId: string | null
  protocol: string | null
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  operacional: 'Operacional',
  administrativa: 'Administrativa',
  comercial: 'Comercial',
  financeira: 'Financeira',
  outra: 'Outra',
}

export const FINANCIAL_STATUS_LABELS: Record<FinancialStatus, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  cancelado: 'Cancelado',
}

export const CASH_MOVEMENT_TYPE_LABELS: Record<CashMovementType, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
}
