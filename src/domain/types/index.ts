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

/** Porta desacoplada — implementação fiscal futura. */
export type FiscalInvoiceRequest = {
  referenceType: 'sale' | 'expense'
  referenceId: string
  amount: number
  description: string
}

export type FiscalInvoiceResult = {
  accepted: boolean
  message: string
  externalId: string | null
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  operacional: 'Operacional',
  administrativa: 'Administrativa',
  comercial: 'Comercial',
  financeira: 'Financeira',
  outra: 'Outra',
}
