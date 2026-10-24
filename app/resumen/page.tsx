'use client'

import { useEffect, useState } from 'react'
import { AuthGate } from '@/components/shared/AuthGate'
import { AppShell, useApp } from '@/components/shared/AppShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { fmt, fmtCompact } from '@/lib/format'
import { useHideSavings } from '@/lib/privacy'
import { currentMonthIndex, monthIndexOf, monthKey, monthLabel, monthShort } from '@/lib/dates'
import { incomeForMonth, installmentsForMonth, expenseLinesForMonth } from '@/lib/finance-calc'
import { Income, BasicExpense, ExpenseMonth, CardTransaction, SavingsEntry } from '@/types/finance'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Receipt,
  CreditCard,
  PiggyBank,
  Wallet,
  Check,
  Clock,
} from 'lucide-react'

const COLORS = { income: '#34d399', outflow: '#fb7185' }
const MASK = '••••••'

function Summary() {
  const { user, scope } = useApp()
  const nowIdx = currentMonthIndex()

  // Por defecto: el último mes completo
  const [mi, setMi] = useState(nowIdx - 1)
  const [loading, setLoading] = useState(true)
  const [incomes, setIncomes] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<BasicExpense[]>([])
  const [monthRows, setMonthRows] = useState<ExpenseMonth[]>([])
  const [txs, setTxs] = useState<CardTransaction[]>([])
  const [savings, setSavings] = useState<SavingsEntry[]>([])
  const [hideSavings] = useHideSavings()

  const isPersonal = scope === 'personal'

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)

      // Seis meses que terminan en el mes elegido
      const keys = Array.from({ length: 6 }, (_, i) => monthKey(mi - 5 + i))

      const inc = supabase.from('incomes').select('*')
      const exp = supabase.from('basic_expenses').select('*')
      const mon = supabase.from('expense_months').select('*').in('month', keys)
      const trx = supabase.from('card_transactions').select('*')

      const [incRes, expRes, monRes, trxRes] = await Promise.all([
        isPersonal ? inc.eq('user_id', user.id).is('household_id', null) : inc.eq('household_id', scope),
        isPersonal ? exp.eq('user_id', user.id).is('household_id', null) : exp.eq('household_id', scope),
        isPersonal ? mon.eq('user_id', user.id).is('household_id', null) : mon.eq('household_id', scope),
        isPersonal ? trx.eq('user_id', user.id).is('household_id', null) : trx.eq('household_id', scope),
      ])

      let savingsData: SavingsEntry[] = []
      if (isPersonal) {
        const { data } = await supabase
          .from('savings_entries')
          .select('*')
          .eq('user_id', user.id)
          .gte('entry_date', keys[0])
          .lt('entry_date', monthKey(mi + 1))
        savingsData = (data ?? []) as SavingsEntry[]
      }

      if (cancelled) return
      setIncomes((incRes.data ?? []) as Income[])
      setExpenses((expRes.data ?? []) as BasicExpense[])
      setMonthRows((monRes.data ?? []) as ExpenseMonth[])
      setTxs((trxRes.data ?? []) as CardTransaction[])
      setSavings(savingsData)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [mi, scope, isPersonal, user.id])

  // Serie de los últimos 6 meses
  const series = Array.from({ length: 6 }, (_, i) => {
    const idx = mi - 5 + i
    const income = incomeForMonth(incomes, idx)
    const lines = expenseLinesForMonth(expenses, monthRows, idx)
    const fixed = lines.reduce((acc, l) => acc + l.amount, 0)
    const installments = installmentsForMonth(txs, idx)
    return {
      idx,
      label: monthShort(idx),
      income,
      fixed,
      installments,
      outflow: fixed + installments,
      lines,
    }
  })

  const current = series[5]
  const previous = series[4]
  const balance = current.income - current.outflow
  const previousBalance = previous.income - previous.outflow
  const balanceDelta = balance - previousBalance

  const paidLines = current.lines.filter((l) => l.paid)
  const pendingLines = current.lines.filter((l) => !l.paid)
  const pendingTotal = pendingLines.reduce((acc, l) => acc + l.amount, 0)

  const savedThisMonth = savings
    .filter((s) => monthIndexOf(s.entry_date) === mi)
    .reduce((acc, s) => acc + Number(s.amount), 0)

  // Gastos fijos por categoría
  const byCategory = new Map<string, number>()
  current.lines.forEach((l) => {
    const cat = l.expense.category || 'Otros'
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + l.amount)
  })
  const categories = Array.from(byCategory.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
  const maxCategory = categories.length > 0 ? categories[0].value : 0

  const inProgress = mi >= nowIdx

  const deltaText = (cur: number, prev: number) => {
    if (prev === 0) return null
    const pct = Math.round(((cur - prev) / Math.abs(prev)) * 100)
    return `${pct >= 0 ? '+' : ''}${pct}% vs mes anterior`
  }

  const kpis = [
    {
      label: 'Ingresos',
      value: fmt(current.income),
      hint: deltaText(current.income, previous.income),
      icon: Wallet,
      color: 'text-emerald-400',
    },
    {
      label: 'Gastos fijos',
      value: fmt(current.fixed),
      hint: `${paidLines.length}/${current.lines.length} pagados`,
      icon: Receipt,
      color: 'text-amber-400',
    },
    {
      label: 'Cuotas de tarjeta',
      value: fmt(current.installments),
      hint: deltaText(current.installments, previous.installments),
      icon: CreditCard,
      color: 'text-purple-400',
    },
    ...(isPersonal
      ? [
          {
            label: 'Ahorrado',
            value: hideSavings ? MASK : fmt(savedThisMonth),
            hint: 'Visible según tu opción en Ahorros',
            icon: PiggyBank,
            color: 'text-sky-400',
          },
        ]
      : []),
  ]

  return (
    <>
      {/* Encabezado con selector de mes */}
      <div className="space-y-3">
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-3xl">
          <CalendarDays className="h-5 w-5 text-emerald-400 sm:h-7 sm:w-7" />
          Resumen mensual
        </h1>

        <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 p-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            aria-label="Mes anterior"
            onClick={() => setMi(mi - 1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <p className="font-semibold">{monthLabel(mi)}</p>
            {inProgress && <p className="text-xs text-amber-400">Mes en curso</p>}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            aria-label="Mes siguiente"
            disabled={mi >= nowIdx}
            onClick={() => setMi(mi + 1)}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Calculando resumen...</p>
      ) : (
        <>
          {/* Balance del mes */}
          <Card className={balance >= 0 ? 'border-emerald-500/25' : 'border-rose-500/30'}>
            <CardContent className="space-y-2 p-4 sm:p-6">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {inProgress ? 'Balance del mes hasta ahora' : 'Balance del mes'}
              </p>
              <p
                className={`text-3xl font-black tabular-nums sm:text-5xl ${
                  balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {fmt(balance)}
              </p>
              <p className="text-sm text-muted-foreground">
                {balance >= 0
                  ? `${inProgress ? 'Vas' : 'Cerraste'} con superávit: tus ingresos cubren los gastos fijos y las cuotas.`
                  : `${inProgress ? 'Vas' : 'Cerraste'} con déficit: los gastos fijos y las cuotas superan tus ingresos.`}
              </p>
              {previous.income + previous.outflow > 0 && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {balanceDelta >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
                  )}
                  <span className="tabular-nums">
                    {balanceDelta >= 0 ? '+' : ''}
                    {fmt(balanceDelta)} frente a {monthLabel(mi - 1)}
                  </span>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Cifras del mes */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpis.map(({ icon: Icon, ...k }) => (
              <Card key={k.label} className="border-emerald-500/15">
                <CardContent className="space-y-1 p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{k.label}</p>
                    <Icon className={`h-4 w-4 shrink-0 ${k.color}`} />
                  </div>
                  <p className={`truncate text-lg font-bold tabular-nums sm:text-2xl ${k.color}`}>{k.value}</p>
                  {k.hint && <p className="text-[11px] text-muted-foreground">{k.hint}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Últimos 6 meses */}
          <Card className="border-emerald-500/15">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Últimos 6 meses
                </span>
                <span className="flex items-center gap-3 text-xs font-normal text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORS.income }} />
                    Ingresos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORS.outflow }} />
                    Gastos y cuotas
                  </span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[240px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="currentColor" strokeOpacity={0.12} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'currentColor', fillOpacity: 0.65 }}
                  />
                  <YAxis
                    width={44}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => fmtCompact(Number(val))}
                    tick={{ fontSize: 11, fill: 'currentColor', fillOpacity: 0.65 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'currentColor', fillOpacity: 0.05 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0) return null
                      return (
                        <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                          <p className="mb-1 text-muted-foreground">{String(label)}</p>
                          {payload.map((p) => (
                            <p key={String(p.dataKey)} className="tabular-nums">
                              {String(p.name)}: <span className="font-semibold">{fmt(Number(p.value ?? 0))}</span>
                            </p>
                          ))}
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="income" name="Ingresos" fill={COLORS.income} fillOpacity={0.85} radius={[5, 5, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="outflow" name="Gastos y cuotas" fill={COLORS.outflow} fillOpacity={0.85} radius={[5, 5, 0, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gastos fijos por categoría y detalle */}
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <Card className="border-emerald-500/15">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Receipt className="h-4 w-4 text-amber-400" />
                  Gastos fijos por categoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categories.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No hay gastos fijos en este mes.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {categories.map((c) => (
                      <li key={c.name} className="space-y-1">
                        <div className="flex justify-between gap-3 text-sm">
                          <span className="truncate">{c.name}</span>
                          <span className="shrink-0 font-semibold tabular-nums text-amber-400">{fmt(c.value)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-amber-400/80"
                            style={{ width: `${maxCategory > 0 ? (c.value / maxCategory) * 100 : 0}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="border-emerald-500/15">
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400" />
                    Estado de los gastos fijos
                  </span>
                  {pendingLines.length > 0 && (
                    <span className="text-xs font-normal text-muted-foreground tabular-nums">
                      Sin pagar <span className="font-semibold text-amber-400">{fmt(pendingTotal)}</span>
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {current.lines.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No hay gastos fijos en este mes.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {[...current.lines]
                      .sort((a, b) => Number(a.paid) - Number(b.paid) || b.amount - a.amount)
                      .map((l) => (
                        <li
                          key={l.expense.id}
                          className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 p-2.5"
                        >
                          {l.paid ? (
                            <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                          ) : (
                            <Clock className="h-4 w-4 shrink-0 text-amber-400" />
                          )}
                          <span
                            className={`min-w-0 flex-1 truncate text-sm ${
                              l.paid ? 'text-muted-foreground' : ''
                            }`}
                          >
                            {l.expense.title}
                          </span>
                          <span className="shrink-0 text-sm font-semibold tabular-nums">{fmt(l.amount)}</span>
                        </li>
                      ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  )
}

export default function ResumenPage() {
  return (
    <AuthGate>
      <AppShell>
        <Summary />
      </AppShell>
    </AuthGate>
  )
}
