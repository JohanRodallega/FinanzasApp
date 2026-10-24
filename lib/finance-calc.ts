import { Income, BasicExpense, CardTransaction, ExpenseMonth } from '@/types/finance'
import { monthIndexOf, monthKey } from '@/lib/dates'

/**
 * Ingresos que corresponden a un mes:
 * - único: solo cuenta en el mes de su fecha
 * - mensual: cuenta cada mes desde su fecha
 * - quincenal: se asume que el monto es por quincena, así que cuenta dos veces al mes
 */
export function incomeForMonth(incomes: Income[], mi: number): number {
  return incomes.reduce((acc, income) => {
    const start = monthIndexOf(income.date)
    const amount = Number(income.amount)

    if (income.frequency === 'unico') return start === mi ? acc + amount : acc
    if (start > mi) return acc
    return acc + (income.frequency === 'quincenal' ? amount * 2 : amount)
  }, 0)
}

/**
 * Cuotas de tarjeta de un mes: cada compra aporta monto / cuotas
 * desde el mes de la compra durante "cuotas" meses.
 */
export function installmentsForMonth(transactions: CardTransaction[], mi: number): number {
  return transactions.reduce((acc, tx) => {
    const n = Math.max(1, Number(tx.installments) || 1)
    const offset = mi - monthIndexOf(tx.created_at)
    if (offset < 0 || offset >= n) return acc
    return acc + Number(tx.amount) / n
  }, 0)
}

export interface ExpenseLine {
  expense: BasicExpense
  amount: number
  paid: boolean
  monthRow?: ExpenseMonth
}

/**
 * Gastos fijos de un mes: usa el monto y el estado guardados para ese mes
 * y, si no hay registro, el monto base del gasto como pendiente.
 */
export function expenseLinesForMonth(
  expenses: BasicExpense[],
  monthRows: ExpenseMonth[],
  mi: number
): ExpenseLine[] {
  const key = monthKey(mi)
  const byExpense = new Map<string, ExpenseMonth>()
  monthRows.forEach((row) => {
    if (row.month.slice(0, 10) === key) byExpense.set(row.expense_id, row)
  })

  return expenses
    .filter((e) => !e.created_at || monthIndexOf(e.created_at) <= mi)
    .map((expense) => {
      const row = byExpense.get(expense.id)
      return {
        expense,
        amount: row ? Number(row.amount) : Number(expense.amount),
        paid: row?.paid ?? false,
        monthRow: row,
      }
    })
}
