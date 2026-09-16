export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    return isoDate
  }

  return new Intl.DateTimeFormat('pt-BR').format(date)
}

export function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    return isoDate
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Soma dias a uma data `YYYY-MM-DD` (ou hoje se inválida). */
export function addDaysInputValue(baseDate: string, days: number): string {
  const source = baseDate && /^\d{4}-\d{2}-\d{2}$/.test(baseDate)
    ? baseDate
    : todayInputValue()
  const date = new Date(`${source}T12:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function computeSaleAmount(input: {
  quantity: number
  unitPrice: number
  deliveryFee: number
  paymentFee1: number
  paymentFee2: number
}): number {
  const subtotal = Math.max(0, input.quantity) * Math.max(0, input.unitPrice)
  return (
    subtotal +
    Math.max(0, input.deliveryFee) +
    Math.max(0, input.paymentFee1) +
    Math.max(0, input.paymentFee2)
  )
}
