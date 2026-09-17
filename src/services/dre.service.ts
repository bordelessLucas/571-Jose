import type {
  DrePeriodFilter,
  DreSummary,
  Expense,
  ExpenseCategory,
  Sale,
} from '@/domain/types'
import { listExpenses } from '@/services/expenses.service'
import { listSales } from '@/services/sales.service'

function inPeriod(dateValue: string, period: DrePeriodFilter | null): boolean {
  if (!period) return true
  return dateValue >= period.from && dateValue <= period.to
}

function sumExpensesByCategory(
  expenses: Expense[],
  category: ExpenseCategory,
): number {
  return expenses
    .filter((expense) => expense.category === category)
    .reduce((sum, expense) => sum + expense.amount, 0)
}

/**
 * DRE gerencial: organiza vendas e despesas na estrutura contabil basica.
 * Impostos, devolucoes, descontos e CMV ainda nao possuem lancamentos proprios.
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
  const deducoes = 0
  const receitaLiquida = receitas - deducoes
  const custos = 0
  const lucroBruto = receitaLiquida - custos
  const despesasOperacionais = sumExpensesByCategory(filteredExpenses, 'operacional')
  const despesasAdministrativas = sumExpensesByCategory(
    filteredExpenses,
    'administrativa',
  )
  const despesasComerciais = sumExpensesByCategory(filteredExpenses, 'comercial')
  const despesasFinanceiras = sumExpensesByCategory(filteredExpenses, 'financeira')
  const outrasDespesas = sumExpensesByCategory(filteredExpenses, 'outra')
  const despesas = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  )

  return {
    receitas,
    deducoes,
    receitaLiquida,
    custos,
    lucroBruto,
    despesasOperacionais,
    despesasAdministrativas,
    despesasComerciais,
    despesasFinanceiras,
    outrasDespesas,
    despesas,
    resultado: lucroBruto - despesas,
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
