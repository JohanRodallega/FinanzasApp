import { Income, BasicExpense, CardTransaction, ExpenseMonth, NormalExpense } from '@/types/finance'
import { monthIndexOf, monthKey } from '@/lib/dates'

/**
 * Ingresos de un mes: cuentan solo los registrados con fecha dentro de ese mes,
 * así un mes nuevo empieza en 0 hasta que se registre el primer pago.
 */
export function incomeForMonth(incomes: Income[], mi: number): number {
  return incomes.reduce(
    (acc, income) => (monthIndexOf(income.date) === mi ? acc + Number(income.amount) : acc),
    0
  )
}

/** Total de ingresos registrados hasta el final de un mes (incluido). */
export function totalIncomeUpTo(incomes: Income[], mi: number): number {
  return incomes.reduce(
    (acc, income) => (monthIndexOf(income.date) <= mi ? acc + Number(income.amount) : acc),
    0
  )
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

/** Gastos normales (sin fecha límite) que caen en un mes. */
export function normalExpensesInMonth(expenses: NormalExpense[], mi: number): NormalExpense[] {
  return expenses.filter((e) => monthIndexOf(e.expense_date) === mi)
}

export const sumNormalExpenses = (expenses: NormalExpense[], mi: number): number =>
  normalExpensesInMonth(expenses, mi).reduce((acc, e) => acc + Number(e.amount), 0)

/**
 * Gastos fijos sin pagar de meses anteriores a `mi`, del más antiguo al más reciente.
 * Cada gasto se revisa desde el mes en que fue creado.
 */
export interface OverdueLine extends ExpenseLine {
  monthIndex: number
}

export function overdueLines(expenses: BasicExpense[], monthRows: ExpenseMonth[], mi: number): OverdueLine[] {
  const result: OverdueLine[] = []
  const first = expenses.reduce(
    (min, e) => Math.min(min, e.created_at ? monthIndexOf(e.created_at) : mi),
    mi
  )
  for (let m = first; m < mi; m++) {
    expenseLinesForMonth(expenses, monthRows, m).forEach((line) => {
      if (!line.paid) result.push({ ...line, monthIndex: m })
    })
  }
  return result
}

export interface BalanceBreakdown {
  incomes: number
  fixedPaid: number
  normal: number
  installments: number
  savings: number
  balance: number
}

/**
 * Saldo real acumulado hasta `mi`: lo recibido menos lo ya pagado
 * (gastos fijos marcados como pagados, gastos normales, cuotas de tarjeta) y lo ahorrado.
 */
export function currentBalance(
  data: {
    incomes: Income[]
    expenseMonths: ExpenseMonth[]
    normals: NormalExpense[]
    transactions: CardTransaction[]
    savingsNet: number
  },
  mi: number
): BalanceBreakdown {
  const incomes = totalIncomeUpTo(data.incomes, mi)
  const fixedPaid = data.expenseMonths
    .filter((r) => r.paid && monthIndexOf(r.month) <= mi)
    .reduce((acc, r) => acc + Number(r.amount), 0)
  const normal = data.normals
    .filter((e) => monthIndexOf(e.expense_date) <= mi)
    .reduce((acc, e) => acc + Number(e.amount), 0)

  const txMonths = data.transactions.map((t) => monthIndexOf(t.created_at))
  const firstTx = txMonths.length > 0 ? Math.min(...txMonths) : mi
  let installments = 0
  for (let m = firstTx; m <= mi; m++) installments += installmentsForMonth(data.transactions, m)

  const savings = data.savingsNet
  return { incomes, fixedPaid, normal, installments, savings, balance: incomes - fixedPaid - normal - installments - savings }
}
