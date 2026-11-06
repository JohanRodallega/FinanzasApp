'use client'

import { useEffect, useState } from 'react'
import { AuthGate } from '@/components/shared/AuthGate'
import { AppShell, useApp } from '@/components/shared/AppShell'
import { EditExpenseModal } from '@/components/gastos/EditExpenseModal'
import { AddIncomeModal } from '@/components/ingresos/AddIncomeModal'
import { AddExpenseModal } from '@/components/gastos/AddExpenseModal'
import { AddNormalExpenseModal } from '@/components/gastos-normales/AddNormalExpenseModal'
import { NormalExpensesCard } from '@/components/gastos-normales/NormalExpensesCard'
import { AddCreditCardModal } from '@/components/tarjetas/AddCreditCardModal'
import { AddCardPaymentModal } from '@/components/tarjetas/AddCardPaymentModal'
import { AddCardTransactionModal } from '@/components/tarjetas/AddCardTransactionModal'
import { DebtsModule } from '@/components/deudas/DebtsModule'
import { FinancialCharts } from '@/components/dashboard/FinancialCharts'
import { KpiGrid } from '@/components/dashboard/KpiGrid'
import { NetBalanceCard } from '@/components/dashboard/NetBalanceCard'
import { FixedExpensesCard } from '@/components/dashboard/FixedExpensesCard'
import { CurrentBalanceCard } from '@/components/dashboard/CurrentBalanceCard'
import { OverdueExpensesCard } from '@/components/dashboard/OverdueExpensesCard'
import { CardsSection } from '@/components/dashboard/CardsSection'
import { IncomeHistoryCard } from '@/components/dashboard/IncomeHistoryCard'
import { SummaryNotice } from '@/components/dashboard/SummaryNotice'
import { supabase } from '@/lib/supabase'
import { useScopedTable } from '@/lib/use-scoped-table'
import { deleteCardPayment, deleteCardTransaction, deleteRow, setExpensePaid } from '@/lib/mutations'
import { currentMonthIndex, monthKey, monthLongName } from '@/lib/dates'
import {
  currentBalance,
  incomeForMonth,
  installmentsForMonth,
  expenseLinesForMonth,
  normalExpensesInMonth,
  overdueLines,
  type ExpenseLine,
} from '@/lib/finance-calc'
import type {
  Income,
  BasicExpense,
  ExpenseMonth,
  CreditCard,
  CardTransaction,
  CardPayment,
  Debt,
  NormalExpense,
  BalanceAdjustment,
} from '@/types/finance'

function Dashboard() {
  const { user, scope, householdId } = useApp()
  const userId = user.id
  const mi = currentMonthIndex()

  const incomes = useScopedTable<Income>('incomes', 'los ingresos', scope, userId)
  const expenses = useScopedTable<BasicExpense>('basic_expenses', 'los gastos fijos', scope, userId)
  const expenseMonths = useScopedTable<ExpenseMonth>('expense_months', 'los pagos del mes', scope, userId)
  const cards = useScopedTable<CreditCard>('credit_cards', 'las tarjetas', scope, userId)
  const transactions = useScopedTable<CardTransaction>('card_transactions', 'las compras con tarjeta', scope, userId)
  const cardPayments = useScopedTable<CardPayment>('card_payments', 'los pagos de tarjetas', scope, userId)
  const debts = useScopedTable<Debt>('debts', 'las deudas', scope, userId)
  const normals = useScopedTable<NormalExpense>('normal_expenses', 'los gastos normales', scope, userId, 'expense_date')
  const adjustments = useScopedTable<BalanceAdjustment>('balance_adjustments', 'los ajustes de saldo', scope, userId)

  const [editing, setEditing] = useState<{ line: ExpenseLine; monthIndex: number } | null>(null)

  // Ahorros netos (solo personales): se descuentan del saldo porque ya no son dinero disponible
  const [savingsNet, setSavingsNet] = useState(0)
  const loadSavings = async () => {
    if (scope !== 'personal') return setSavingsNet(0)
    const { data } = await supabase.from('savings_entries').select('amount').eq('user_id', userId)
    setSavingsNet((data ?? []).reduce((acc, e) => acc + Number(e.amount), 0))
  }
  useEffect(() => {
    loadSavings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, userId])

  const refetchAll = () =>
    [incomes, expenses, expenseMonths, cards, transactions, cardPayments, debts, normals, adjustments].forEach((t) => t.refetch())

  // Gastos fijos: cambio inmediato en pantalla y luego se confirma con la base de datos
  const handleTogglePaid = async (line: ExpenseLine, monthIndex = mi) => {
    const paid = !line.paid
    const id = line.expense.id
    const key = monthKey(monthIndex)
    expenseMonths.setRows((prev) => [
      ...prev.filter((r) => !(r.expense_id === id && r.month.slice(0, 10) === key)),
      {
        id: line.monthRow?.id ?? `tmp-${id}`,
        expense_id: id,
        month: key,
        amount: line.amount,
        paid,
        paid_at: paid ? new Date().toISOString() : null,
      },
    ])
    await setExpensePaid(line, monthIndex, paid)
    expenseMonths.refetch()
  }

  const handleDeleteExpense = async (id: string) => {
    if (await deleteRow('basic_expenses', id, '¿Eliminar este gasto fijo? Se borra también su historial de pagos.', 'el gasto')) {
      expenses.refetch()
      expenseMonths.refetch()
    }
  }

  const handleDeleteTransaction = async (tx: CardTransaction) => {
    await deleteCardTransaction(tx, cards.rows.find((c) => c.id === tx.card_id))
    refetchAll()
  }

  const expenseLines = expenseLinesForMonth(expenses.rows, expenseMonths.rows, mi).sort(
    (a, b) => Number(a.expense.due_date) - Number(b.expense.due_date)
  )
  const overdue = overdueLines(expenses.rows, expenseMonths.rows, mi)
  const balance = currentBalance(
    {
      incomes: incomes.rows,
      expenseMonths: expenseMonths.rows,
      normals: normals.rows,
      transactions: transactions.rows,
      cardPayments: cardPayments.rows,
      savingsNet,
      adjustments: adjustments.rows,
    },
    mi
  )
  const monthNormals = normalExpensesInMonth(normals.rows, mi)

  const totalFixed = expenseLines.reduce((acc, l) => acc + l.amount, 0)
  const totalNormal = monthNormals.reduce((acc, e) => acc + Number(e.amount), 0)
  const totalIncomes = incomeForMonth(incomes.rows, mi)
  const totalCardDebt = cards.rows.reduce((acc, c) => acc + Number(c.current_balance ?? 0), 0)
  const totalInstallments = installmentsForMonth(transactions.rows, mi)

  return (
    <>
      {/* Aviso del resumen del mes anterior (primeros días del mes) */}
      {new Date().getDate() <= 7 && (
        <SummaryNotice monthId={monthKey(mi - 1)} monthName={monthLongName(mi - 1)} />
      )}

      {/* Encabezado y acciones rápidas */}
      <div className="space-y-3 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:space-y-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Dashboard de Finanzapp<span className="animate-pulse text-emerald-700 dark:text-emerald-400">_</span>
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Ingresos, gastos fijos, gastos normales, tarjetas y compras a cuotas.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <AddIncomeModal onIncomeAdded={refetchAll} householdId={householdId} />
          <AddExpenseModal onExpenseAdded={refetchAll} householdId={householdId} />
          <AddNormalExpenseModal onAdded={refetchAll} householdId={householdId} />
          <AddCreditCardModal onCardAdded={refetchAll} householdId={householdId} />
          <AddCardTransactionModal cards={cards.rows} onTransactionAdded={refetchAll} />
          <AddCardPaymentModal cards={cards.rows} onPaymentAdded={refetchAll} />
        </div>
      </div>

      <CurrentBalanceCard breakdown={balance} householdId={householdId} onAdjusted={adjustments.refetch} />

      <KpiGrid
        totalIncomes={totalIncomes}
        totalExpenses={totalFixed}
        paidCount={expenseLines.filter((l) => l.paid).length}
        expenseCount={expenseLines.length}
        totalCardDebt={totalCardDebt}
        cardCount={cards.rows.length}
      />

      <NetBalanceCard
        monthIndex={mi}
        totalIncomes={totalIncomes}
        fixed={totalFixed}
        installments={totalInstallments}
        normal={totalNormal}
      />

      <OverdueExpensesCard
        lines={overdue}
        onToggle={(l) => handleTogglePaid(l, l.monthIndex)}
        onEdit={(l) => setEditing({ line: l, monthIndex: l.monthIndex })}
      />

      <FixedExpensesCard
        monthIndex={mi}
        lines={expenseLines}
        loading={expenses.loading}
        onToggle={handleTogglePaid}
        onEdit={(l) => setEditing({ line: l, monthIndex: mi })}
      />

      <NormalExpensesCard
        monthIndex={mi}
        expenses={monthNormals}
        loading={normals.loading}
        limit={6}
        onDelete={async (id) => {
          if (await deleteRow('normal_expenses', id, '¿Eliminar este gasto?', 'el gasto')) normals.refetch()
        }}
      />

      <FinancialCharts
        totalIncomes={totalIncomes}
        totalExpenses={totalFixed}
        totalNormalExpenses={totalNormal}
        totalCardDebt={totalCardDebt}
        totalMonthlyInstallments={totalInstallments}
      />

      <CardsSection
        cards={cards.rows}
        loadingCards={cards.loading}
        transactions={transactions.rows}
        loadingTransactions={transactions.loading}
        onDeleteCard={async (id) => {
          if (await deleteRow('credit_cards', id, '¿Eliminar esta tarjeta?', 'la tarjeta')) cards.refetch()
        }}
        onDeleteTransaction={handleDeleteTransaction}
        payments={cardPayments.rows}
        onDeletePayment={async (p) => {
          if (await deleteCardPayment(p, cards.rows.find((c) => c.id === p.card_id))) refetchAll()
        }}
      />

      <IncomeHistoryCard
        incomes={incomes.rows}
        loading={incomes.loading}
        onDelete={async (id) => {
          if (await deleteRow('incomes', id, '¿Eliminar este ingreso?', 'el ingreso')) incomes.refetch()
        }}
      />

      <DebtsModule debts={debts.rows} onDebtUpdated={refetchAll} householdId={householdId} />

      <EditExpenseModal
        line={editing?.line ?? null}
        monthIndex={editing?.monthIndex ?? mi}
        onClose={() => setEditing(null)}
        onSaved={() => {
          expenses.refetch()
          expenseMonths.refetch()
        }}
        onDelete={handleDeleteExpense}
      />
    </>
  )
}

export default function Home() {
  return (
    <AuthGate>
      <AppShell>
        <Dashboard />
      </AppShell>
    </AuthGate>
  )
}
