import { describe, expect, it } from 'vitest'
import {
  expenseLinesForMonth,
  incomeForMonth,
  installmentsForMonth,
  normalExpensesInMonth,
  sumNormalExpenses,
} from '@/lib/finance-calc'
import { monthIndexOf } from '@/lib/dates'
import type { BasicExpense, CardTransaction, ExpenseMonth, Income, NormalExpense } from '@/types/finance'

const mi = (date: string) => monthIndexOf(date)

const income = (frequency: string, amount: number, date: string) =>
  ({ id: 'i', frequency, amount, date }) as unknown as Income

describe('incomeForMonth', () => {
  it('cuenta el ingreso único solo en su mes', () => {
    const list = [income('unico', 500, '2026-10-10')]
    expect(incomeForMonth(list, mi('2026-10-01'))).toBe(500)
    expect(incomeForMonth(list, mi('2026-11-01'))).toBe(0)
  })

  it('repite el mensual desde su fecha de inicio', () => {
    const list = [income('mensual', 1000, '2026-09-01')]
    expect(incomeForMonth(list, mi('2026-08-01'))).toBe(0)
    expect(incomeForMonth(list, mi('2026-12-01'))).toBe(1000)
  })

  it('cuenta dos veces el quincenal', () => {
    const list = [income('quincenal', 1300000, '2026-10-01')]
    expect(incomeForMonth(list, mi('2026-10-01'))).toBe(2600000)
  })
})

describe('installmentsForMonth', () => {
  const tx = (amount: number, installments: number, created_at: string) =>
    ({ id: 't', amount, installments, created_at }) as unknown as CardTransaction

  it('reparte la compra en cuotas iguales durante N meses', () => {
    const list = [tx(900, 3, '2026-10-05T10:00:00')]
    expect(installmentsForMonth(list, mi('2026-09-01'))).toBe(0)
    expect(installmentsForMonth(list, mi('2026-10-01'))).toBe(300)
    expect(installmentsForMonth(list, mi('2026-12-01'))).toBe(300)
    expect(installmentsForMonth(list, mi('2027-01-01'))).toBe(0)
  })

  it('trata cuotas inválidas como 1', () => {
    const list = [tx(100, 0, '2026-10-05T10:00:00')]
    expect(installmentsForMonth(list, mi('2026-10-01'))).toBe(100)
  })
})

describe('expenseLinesForMonth', () => {
  const expense = (id: string, amount: number, created_at: string) =>
    ({ id, amount, created_at }) as unknown as BasicExpense
  const row = (expense_id: string, month: string, amount: number, paid: boolean) =>
    ({ id: `r-${expense_id}`, expense_id, month, amount, paid }) as unknown as ExpenseMonth

  it('usa el registro del mes si existe y el monto base si no', () => {
    const lines = expenseLinesForMonth(
      [expense('a', 100, '2026-01-01T00:00:00'), expense('b', 200, '2026-01-01T00:00:00')],
      [row('a', '2026-10-01', 150, true)],
      mi('2026-10-01')
    )
    expect(lines.find((l) => l.expense.id === 'a')).toMatchObject({ amount: 150, paid: true })
    expect(lines.find((l) => l.expense.id === 'b')).toMatchObject({ amount: 200, paid: false })
  })

  it('ignora gastos creados después del mes consultado', () => {
    const lines = expenseLinesForMonth([expense('c', 50, '2026-11-02T00:00:00')], [], mi('2026-10-01'))
    expect(lines).toHaveLength(0)
  })
})

describe('gastos normales', () => {
  const normal = (amount: number, expense_date: string) =>
    ({ id: expense_date, amount, expense_date, title: 't', category: 'Tienda' }) as unknown as NormalExpense
  const list = [normal(100, '2026-10-01'), normal(250, '2026-10-31'), normal(999, '2026-11-01')]

  it('solo toma los gastos del mes consultado', () => {
    expect(normalExpensesInMonth(list, mi('2026-10-15'))).toHaveLength(2)
  })

  it('suma los montos del mes sin correr fechas de borde', () => {
    expect(sumNormalExpenses(list, mi('2026-10-15'))).toBe(350)
    expect(sumNormalExpenses(list, mi('2026-11-15'))).toBe(999)
    expect(sumNormalExpenses(list, mi('2026-09-15'))).toBe(0)
  })
})
