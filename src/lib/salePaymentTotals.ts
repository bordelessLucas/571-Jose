import type { PaymentMethod, Sale } from '@/domain/types'

export type SalePaymentTotals = Record<Exclude<PaymentMethod, ''>, number> & {
  otherTotal: number
}

const PAYMENT_METHODS: Exclude<PaymentMethod, ''>[] = [
  'dinheiro',
  'pix',
  'fiado',
  'cartao_credito',
  'cartao_debito',
  'boleto',
  'transferencia',
  'cheque',
]

export function emptySalePaymentTotals(): SalePaymentTotals {
  return {
    dinheiro: 0,
    pix: 0,
    fiado: 0,
    cartao_credito: 0,
    cartao_debito: 0,
    boleto: 0,
    transferencia: 0,
    cheque: 0,
    otherTotal: 0,
  }
}

export function addSaleToPaymentTotals(
  totals: SalePaymentTotals,
  sale: Pick<
    Sale,
    'amount' | 'paymentMethod1' | 'paymentMethod2' | 'paymentAmount1' | 'paymentAmount2'
  >,
): SalePaymentTotals {
  const methods = [sale.paymentMethod1, sale.paymentMethod2].filter(
    (method): method is Exclude<PaymentMethod, ''> =>
      Boolean(method) &&
      PAYMENT_METHODS.includes(method as Exclude<PaymentMethod, ''>),
  )

  if (methods.length === 0) {
    totals.otherTotal += sale.amount
    return totals
  }

  const explicitTotal = Math.max(0, sale.paymentAmount1) + Math.max(0, sale.paymentAmount2)

  if (explicitTotal > 0) {
    if (sale.paymentMethod1 && methods.includes(sale.paymentMethod1)) {
      totals[sale.paymentMethod1] += Math.max(0, sale.paymentAmount1)
    }
    if (sale.paymentMethod2 && methods.includes(sale.paymentMethod2)) {
      totals[sale.paymentMethod2] += Math.max(0, sale.paymentAmount2)
    }
    return totals
  }

  const splitAmount = sale.amount / methods.length
  for (const method of methods) {
    totals[method] += splitAmount
  }
  return totals
}

export function calculateSalePaymentTotals(
  sales: Pick<
    Sale,
    'amount' | 'paymentMethod1' | 'paymentMethod2' | 'paymentAmount1' | 'paymentAmount2'
  >[],
): SalePaymentTotals {
  return sales.reduce(
    (totals, sale) => addSaleToPaymentTotals(totals, sale),
    emptySalePaymentTotals(),
  )
}
