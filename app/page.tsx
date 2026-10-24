'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { AuthGate } from '@/components/shared/AuthGate'
import { AppShell, useApp } from '@/components/shared/AppShell'
import { ListRow } from '@/components/shared/ListRow'
import { SegmentBar } from '@/components/shared/SegmentBar'
import { ExpenseRow } from '@/components/gastos/ExpenseRow'
import { EditExpenseModal } from '@/components/gastos/EditExpenseModal'
import { AddIncomeModal } from '@/components/ingresos/AddIncomeModal'
import { AddExpenseModal } from '@/components/gastos/AddExpenseModal'
import { AddCreditCardModal } from '@/components/tarjetas/AddCreditCardModal'
import { AddCardTransactionModal } from '@/components/tarjetas/AddCardTransactionModal'
import { DebtsModule } from '@/components/deudas/DebtsModule'
import { FinancialCharts } from '@/components/dashboard/FinancialCharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { ownerFields } from '@/lib/scope'
import { fmt } from '@/lib/format'
import { currentMonthIndex, monthKey, monthLabel, monthLongName } from '@/lib/dates'
import {
  incomeForMonth,
  installmentsForMonth,
  expenseLinesForMonth,
  type ExpenseLine,
} from '@/lib/finance-calc'
import {
  Income,
  BasicExpense,
  ExpenseMonth,
  CreditCard,
  CardTransaction,
  Debt,
} from '@/types/finance'
import {
  Wallet,
  CreditCard as CardIcon,
  Receipt,
  TrendingDown,
  TrendingUp,
  ShoppingBag,
  PiggyBank,
  Terminal,
  CalendarDays,
  ArrowRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const frequencyLabel: Record<string, string> = {
  mensual: 'Mensual',
  quincenal: 'Quincenal (2 pagos al mes)',
  unico: 'Único / Ocasional',
}

function EmptyState({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-center">
      <Icon className="h-6 w-6 text-muted-foreground/60" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

function Dashboard() {
  const { user, scope, householdId } = useApp()
  const userId = user.id

  // Mes actual
  const mi = currentMonthIndex()
  const miKey = monthKey(mi)

  // 1. Estados
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loadingIncomes, setLoadingIncomes] = useState(true)

  const [expenses, setExpenses] = useState<BasicExpense[]>([])
  const [expenseMonths, setExpenseMonths] = useState<ExpenseMonth[]>([])
  const [loadingExpenses, setLoadingExpenses] = useState(true)
  const [editingLine, setEditingLine] = useState<ExpenseLine | null>(null)

  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [loadingCards, setLoadingCards] = useState(true)

  const [transactions, setTransactions] = useState<CardTransaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(true)

  const [debts, setDebts] = useState<Debt[]>([])

  // 2. Carga de datos según la vista (personal u hogar)
  const fetchIncomes = useCallback(async () => {
    setLoadingIncomes(true)
    const base = supabase.from('incomes').select('*')
    const { data } = await (scope === 'personal'
      ? base.eq('user_id', userId).is('household_id', null)
      : base.eq('household_id', scope)
    ).order('created_at', { ascending: false })
    if (data) setIncomes(data as Income[])
    setLoadingIncomes(false)
  }, [scope, userId])

  const fetchExpenses = useCallback(async () => {
    setLoadingExpenses(true)
    const base = supabase.from('basic_expenses').select('*')
    const { data } = await (scope === 'personal'
      ? base.eq('user_id', userId).is('household_id', null)
      : base.eq('household_id', scope)
    ).order('created_at', { ascending: false })
    if (data) setExpenses(data as BasicExpense[])
    setLoadingExpenses(false)
  }, [scope, userId])

  const fetchExpenseMonths = useCallback(async () => {
    const base = supabase.from('expense_months').select('*').eq('month', miKey)
    const { data } = await (scope === 'personal'
      ? base.eq('user_id', userId).is('household_id', null)
      : base.eq('household_id', scope)
    )
    if (data) setExpenseMonths(data as ExpenseMonth[])
  }, [scope, userId, miKey])

  const fetchCreditCards = useCallback(async () => {
    setLoadingCards(true)
    const base = supabase.from('credit_cards').select('*')
    const { data } = await (scope === 'personal'
      ? base.eq('user_id', userId).is('household_id', null)
      : base.eq('household_id', scope)
    ).order('created_at', { ascending: false })
    if (data) setCreditCards(data as CreditCard[])
    setLoadingCards(false)
  }, [scope, userId])

  const fetchTransactions = useCallback(async () => {
    setLoadingTransactions(true)
    const base = supabase.from('card_transactions').select('*')
    const { data } = await (scope === 'personal'
      ? base.eq('user_id', userId).is('household_id', null)
      : base.eq('household_id', scope)
    ).order('created_at', { ascending: false })
    if (data) setTransactions(data as CardTransaction[])
    setLoadingTransactions(false)
  }, [scope, userId])

  const fetchDebts = useCallback(async () => {
    const base = supabase.from('debts').select('*')
    const { data } = await (scope === 'personal'
      ? base.eq('user_id', userId).is('household_id', null)
      : base.eq('household_id', scope)
    ).order('created_at', { ascending: false })
    if (data) setDebts(data as Debt[])
  }, [scope, userId])

  const fetchAllData = useCallback(() => {
    fetchIncomes()
    fetchExpenses()
    fetchExpenseMonths()
    fetchCreditCards()
    fetchTransactions()
    fetchDebts()
  }, [fetchIncomes, fetchExpenses, fetchExpenseMonths, fetchCreditCards, fetchTransactions, fetchDebts])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // 3. Acciones sobre gastos fijos
  const handleTogglePaid = async (line: ExpenseLine) => {
    const next = !line.paid
    const expenseId = line.expense.id

    // Cambio inmediato en pantalla; luego se confirma con la base de datos
    setExpenseMonths((prev) => [
      ...prev.filter((r) => r.expense_id !== expenseId),
      {
        id: line.monthRow?.id ?? `tmp-${expenseId}`,
        expense_id: expenseId,
        month: miKey,
        amount: line.amount,
        paid: next,
        paid_at: next ? new Date().toISOString() : null,
      },
    ])

    const owner = await ownerFields(line.expense.household_id ?? null)
    if (!owner) {
      fetchExpenseMonths()
      return
    }

    const { error } = await supabase.from('expense_months').upsert(
      {
        expense_id: expenseId,
        month: miKey,
        amount: line.amount,
        paid: next,
        paid_at: next ? new Date().toISOString() : null,
        user_id: owner.user_id,
        household_id: owner.household_id,
      },
      { onConflict: 'expense_id,month' }
    )

    if (error) {
      console.error('Error al actualizar el pago:', error.message)
      alert('No se pudo actualizar el gasto: ' + error.message)
    }
    fetchExpenseMonths()
  }

  // 4. Eliminaciones (con confirmación para evitar toques accidentales)
  const handleDeleteIncome = async (id: string) => {
    if (!window.confirm('¿Eliminar este ingreso?')) return
    const { error } = await supabase.from('incomes').delete().eq('id', id)
    if (!error) fetchIncomes()
  }

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('¿Eliminar este gasto fijo? Se borra también su historial de pagos.')) return
    const { error } = await supabase.from('basic_expenses').delete().eq('id', id)
    if (!error) {
      fetchExpenses()
      fetchExpenseMonths()
    }
  }

  const handleDeleteCard = async (id: string) => {
    if (!window.confirm('¿Eliminar esta tarjeta?')) return
    const { error } = await supabase.from('credit_cards').delete().eq('id', id)
    if (!error) fetchCreditCards()
  }

  const handleDeleteTransaction = async (tx: CardTransaction) => {
    if (!window.confirm('¿Eliminar esta compra?')) return
    const { error } = await supabase.from('card_transactions').delete().eq('id', tx.id)

    if (!error) {
      const card = creditCards.find((c) => c.id === tx.card_id)
      if (card) {
        const currentBal = card.current_balance ?? 0
        const newBalance = Math.max(0, Number(currentBal) - Number(tx.amount))
        const { error: updateError } = await supabase
          .from('credit_cards')
          .update({ current_balance: newBalance })
          .eq('id', card.id)
        if (updateError) console.error('Error al actualizar saldo:', updateError.message)
      }
      fetchAllData()
    }
  }

  // 5. Cálculos del mes
  const expenseLines = expenseLinesForMonth(expenses, expenseMonths, mi).sort(
    (a, b) => Number(a.expense.due_date) - Number(b.expense.due_date)
  )
  const totalExpenses = expenseLines.reduce((acc, l) => acc + l.amount, 0)
  const paidExpenses = expenseLines.filter((l) => l.paid).reduce((acc, l) => acc + l.amount, 0)
  const pendingExpenses = totalExpenses - paidExpenses
  const paidCount = expenseLines.filter((l) => l.paid).length
  const paidPercent = expenseLines.length > 0 ? Math.round((paidCount / expenseLines.length) * 100) : 0

  const totalIncomes = incomeForMonth(incomes, mi)
  const totalCardDebt = creditCards.reduce((acc, curr) => acc + Number(curr.current_balance ?? 0), 0)
  const totalMonthlyInstallments = installmentsForMonth(transactions, mi)

  const totalMonthlyOutflow = totalExpenses + totalMonthlyInstallments
  const netBalance = totalIncomes - totalMonthlyOutflow
  const commitmentRatio =
    totalIncomes > 0 ? Math.min(100, Math.round((totalMonthlyOutflow / totalIncomes) * 100)) : 0

  const showSummaryBanner = new Date().getDate() <= 7

  const kpis = [
    { label: 'Ingresos', value: fmt(totalIncomes), hint: 'Este mes', icon: Wallet, color: 'text-emerald-400' },
    {
      label: 'Gastos fijos',
      value: fmt(totalExpenses),
      hint: `${paidCount}/${expenseLines.length} pagados`,
      icon: Receipt,
      color: 'text-amber-400',
    },
    { label: 'Deuda tarjetas', value: fmt(totalCardDebt), hint: 'Uso acumulado', icon: TrendingDown, color: 'text-rose-400' },
    { label: 'Tarjetas', value: String(creditCards.length), hint: 'Registradas', icon: CardIcon, color: 'text-sky-400' },
  ]

  return (
    <>
      {/* Aviso del resumen del mes anterior (primeros días del mes) */}
      {showSummaryBanner && (
        <Link
          href="/resumen"
          className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm transition-colors hover:bg-emerald-500/15"
        >
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>
              Ya está listo tu resumen de <strong>{monthLongName(mi - 1)}</strong>
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-emerald-400" />
        </Link>
      )}

      {/* Encabezado y acciones rápidas */}
      <div className="space-y-3 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:space-y-0">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-3xl">
            <Terminal className="h-5 w-5 text-emerald-400 sm:h-7 sm:w-7" />
            <span>
              Dashboard de Finanzas<span className="animate-pulse text-emerald-400">_</span>
            </span>
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Ingresos, gastos fijos, tarjetas y compras a cuotas.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <AddIncomeModal onIncomeAdded={fetchAllData} householdId={householdId} />
          <AddExpenseModal onExpenseAdded={fetchAllData} householdId={householdId} />
          <AddCreditCardModal onCardAdded={fetchAllData} householdId={householdId} />
          <AddCardTransactionModal cards={creditCards} onTransactionAdded={fetchAllData} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {kpis.map(({ icon: Icon, ...kpi }) => (
          <Card key={kpi.label} className="border-emerald-500/15">
            <CardContent className="space-y-1 p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground sm:text-xs">
                  {kpi.label}
                </p>
                <Icon className={`h-4 w-4 shrink-0 ${kpi.color}`} />
              </div>
              <p className={`truncate text-lg font-bold tabular-nums sm:text-2xl ${kpi.color}`}>
                {kpi.value}
              </p>
              <p className="text-[11px] text-muted-foreground sm:text-xs">{kpi.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estado financiero neto */}
      <Card className="border-emerald-500/15">
        <CardHeader className="pb-2">
          <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-purple-400" />
              Estado financiero · {monthLabel(mi)}
            </span>
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                netBalance >= 0
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
              }`}
            >
              {netBalance >= 0 ? 'SUPERÁVIT' : 'DÉFICIT'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div
              className={`order-first col-span-2 rounded-lg border p-3 sm:order-last sm:col-span-1 ${
                netBalance >= 0
                  ? 'border-purple-500/20 bg-purple-500/5'
                  : 'border-rose-500/30 bg-rose-500/10'
              }`}
            >
              <p className="text-xs text-muted-foreground">
                {netBalance >= 0 ? 'Dinero libre estimado' : 'Faltante estimado'}
              </p>
              <p
                className={`mt-1 text-2xl font-black tabular-nums ${
                  netBalance >= 0 ? 'text-purple-400' : 'text-rose-400'
                }`}
              >
                {fmt(netBalance)}
              </p>
            </div>

            <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-3">
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-emerald-400" /> Ingresos
              </p>
              <p className="mt-1 text-base font-bold tabular-nums text-emerald-400 sm:text-xl">
                +{fmt(totalIncomes)}
              </p>
            </div>

            <div className="rounded-lg border border-rose-500/10 bg-rose-500/5 p-3">
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingDown className="h-3 w-3 text-rose-400" /> Gastos + cuotas
              </p>
              <p className="mt-1 text-base font-bold tabular-nums text-rose-400 sm:text-xl">
                -{fmt(totalMonthlyOutflow)}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Fijos {fmt(totalExpenses)} · Cuotas {fmt(totalMonthlyInstallments)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Capacidad de ingresos comprometida</span>
              <span
                className={`font-bold tabular-nums ${
                  commitmentRatio > 80 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {commitmentRatio}%
              </span>
            </div>
            <SegmentBar percent={commitmentRatio} />
          </div>
        </CardContent>
      </Card>

      {/* Gastos fijos del mes: pagar y editar */}
      <Card className="border-emerald-500/15">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-amber-400" />
              Gastos fijos · {monthLabel(mi)}
            </span>
            {expenseLines.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground tabular-nums">
                Pendiente <span className="font-semibold text-amber-400">{fmt(pendingExpenses)}</span>
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingExpenses ? (
            <p className="text-sm text-muted-foreground">Cargando gastos fijos...</p>
          ) : expenseLines.length === 0 ? (
            <EmptyState icon={Receipt} text="No hay gastos fijos registrados aún." />
          ) : (
            <>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {paidCount} de {expenseLines.length} pagados
                  </span>
                  <span className="tabular-nums">{paidPercent}%</span>
                </div>
                <SegmentBar percent={paidPercent} colorClass="bg-emerald-400" />
              </div>
              <ul className="space-y-2">
                {expenseLines.map((line) => (
                  <ExpenseRow
                    key={line.expense.id}
                    title={line.expense.title}
                    subtitle={`${line.expense.category ? `${line.expense.category} · ` : ''}Día ${line.expense.due_date}`}
                    amount={fmt(line.amount)}
                    paid={line.paid}
                    onToggle={() => handleTogglePaid(line)}
                    onEdit={() => setEditingLine(line)}
                  />
                ))}
              </ul>
              <p className="text-[11px] text-muted-foreground">
                Toca la casilla para marcar como pagado. Toca el gasto para cambiar su monto de este mes.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Gráficos */}
      <FinancialCharts
        totalIncomes={totalIncomes}
        totalExpenses={totalExpenses}
        totalCardDebt={totalCardDebt}
        totalMonthlyInstallments={totalMonthlyInstallments}
      />

      {/* Tarjetas y compras */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card className="border-emerald-500/15">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CardIcon className="h-4 w-4 text-sky-400" />
              Mis tarjetas de crédito
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCards ? (
              <p className="text-sm text-muted-foreground">Cargando tarjetas...</p>
            ) : creditCards.length === 0 ? (
              <EmptyState icon={CardIcon} text="No hay tarjetas registradas aún." />
            ) : (
              <ul className="space-y-2">
                {creditCards.map((card) => {
                  const cardName = card.name ?? card.card_alias ?? card.bank_name ?? 'Tarjeta'
                  const cardBal = Number(card.current_balance ?? 0)
                  const totalLimit = Number(card.total_limit ?? 0)
                  const usage = totalLimit > 0 ? Math.round((cardBal / totalLimit) * 100) : 0

                  return (
                    <ListRow
                      key={card.id}
                      icon={<CardIcon className="h-5 w-5 text-sky-400" />}
                      title={cardName}
                      subtitle={`Cupo ${fmt(totalLimit)}`}
                      amount={fmt(cardBal)}
                      amountClassName="text-rose-400"
                      secondary={`${usage}% usado`}
                      onDelete={() => handleDeleteCard(card.id)}
                    />
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-emerald-500/15">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingBag className="h-4 w-4 text-purple-400" />
              Compras recientes con tarjeta
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTransactions ? (
              <p className="text-sm text-muted-foreground">Cargando compras...</p>
            ) : transactions.length === 0 ? (
              <EmptyState icon={ShoppingBag} text="No hay compras registradas aún." />
            ) : (
              <ul className="space-y-2">
                {transactions.map((tx) => {
                  const installments = Number(tx.installments) || 1
                  return (
                    <ListRow
                      key={tx.id}
                      icon={<ShoppingBag className="h-5 w-5 text-purple-400" />}
                      title={tx.description}
                      subtitle={`${installments} ${installments === 1 ? 'cuota' : 'cuotas'} · ${fmt(Number(tx.amount) / installments)}/mes`}
                      amount={fmt(Number(tx.amount))}
                      amountClassName="text-purple-400"
                      onDelete={() => handleDeleteTransaction(tx)}
                    />
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ingresos */}
      <Card className="border-emerald-500/15">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            Historial de ingresos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingIncomes ? (
            <p className="text-sm text-muted-foreground">Cargando ingresos...</p>
          ) : incomes.length === 0 ? (
            <EmptyState icon={Wallet} text="No hay ingresos registrados aún." />
          ) : (
            <ul className="grid gap-2 lg:grid-cols-2">
              {incomes.map((income) => (
                <ListRow
                  key={income.id}
                  icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
                  title={income.title}
                  subtitle={frequencyLabel[income.frequency] ?? income.frequency}
                  amount={fmt(Number(income.amount))}
                  amountClassName="text-emerald-400"
                  onDelete={() => handleDeleteIncome(income.id)}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Deudas y préstamos */}
      <DebtsModule debts={debts} onDebtUpdated={fetchAllData} householdId={householdId} />

      <EditExpenseModal
        line={editingLine}
        monthIndex={mi}
        onClose={() => setEditingLine(null)}
        onSaved={() => {
          fetchExpenses()
          fetchExpenseMonths()
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
