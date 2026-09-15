import type { DrePeriodFilter, DreSummary, Expense, Sale } from '@/domain/types'
import { listExpenses } from '@/services/expenses.service'
import { listSales } from '@/services/sales.service'

function inPeriod(dateValue: string, period: DrePeriodFilter | null): boolean {
  if (!period) return true
  return dateValue >= period.from && dateValue <= period.to
}

/**
 * DRE simplificada: receitas (vendas) − despesas.
 * Agregação na camada de serviço (regra de negócio / futura Cloud Function).
 */
export function calculateDreSummary(
  sales: Sale[],
  expenses: Expense[],
  period: DrePeriodFilter | null = null,
): DreSummary {
  const filteredSales = sales.filter((sale) => inPeriod(sale.soldAt, period))
  const filteredExpenses = expenses.filter((expense) =>
    inPeriod(expense.expenseDate, period),
  )

  const receitas = filteredSales.reduce((sum, sale) => sum + sale.amount, 0)
  const despesas = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  )

  return {
    receitas,
    despesas,
    resultado: receitas - despesas,
    salesCount: filteredSales.length,
    expensesCount: filteredExpenses.length,
    period,
  }
}

export async function getDreSummary(
  period: DrePeriodFilter | null = null,
): Promise<DreSummary> {
  const [sales, expenses] = await Promise.all([listSales(), listExpenses()])
  return calculateDreSummary(sales, expenses, period)
}
