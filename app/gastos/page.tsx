'use client'

import { useState } from 'react'
import { AuthGate } from '@/components/shared/AuthGate'
import { AppShell, useApp } from '@/components/shared/AppShell'
import { AddNormalExpenseModal } from '@/components/gastos-normales/AddNormalExpenseModal'
import { NormalExpensesCard } from '@/components/gastos-normales/NormalExpensesCard'
import { NORMAL_CATEGORIES } from '@/components/gastos-normales/categories'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useScopedTable } from '@/lib/use-scoped-table'
import { deleteRow } from '@/lib/mutations'
import { normalExpensesInMonth } from '@/lib/finance-calc'
import { currentMonthIndex, monthLabel } from '@/lib/dates'
import { fmt } from '@/lib/format'
import type { NormalExpense } from '@/types/finance'
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react'

function NormalExpenses() {
  const { user, scope, householdId } = useApp()
  const { rows, loading, refetch } = useScopedTable<NormalExpense>(
    'normal_expenses',
    'los gastos normales',
    scope,
    user.id,
    'expense_date'
  )

  const thisMonth = currentMonthIndex()
  const [mi, setMi] = useState(thisMonth)

  const monthRows = normalExpensesInMonth(rows, mi)
  const total = monthRows.reduce((acc, e) => acc + Number(e.amount), 0)

  const byCategory = NORMAL_CATEGORIES.map((c) => ({
    ...c,
    total: monthRows.filter((e) => e.category === c.value).reduce((acc, e) => acc + Number(e.amount), 0),
  }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)

  return (
    <>
      <div className="space-y-3 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:space-y-0">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-3xl">
            <ShoppingCart className="h-5 w-5 text-rose-600 dark:text-rose-400 sm:h-7 sm:w-7" />
            Gastos normales
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Transferencias, pagos en tiendas y gastos sin fecha límite.
          </p>
        </div>
        <AddNormalExpenseModal onAdded={refetch} householdId={householdId} />
      </div>

      <Card className="border-emerald-500/15">
        <CardContent className="flex items-center justify-between gap-2 p-2">
          <Button type="button" variant="ghost" size="icon" aria-label="Mes anterior" onClick={() => setMi(mi - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold sm:text-base">{monthLabel(mi)}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Mes siguiente"
            disabled={mi >= thisMonth}
            onClick={() => setMi(mi + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <Card className="border-emerald-500/15">
        <CardContent className="space-y-1 p-4">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground sm:text-xs">Total del mes</p>
          <p className="text-2xl font-black tabular-nums text-rose-600 dark:text-rose-400 sm:text-4xl">{fmt(total)}</p>
          <p className="text-xs text-muted-foreground">
            {monthRows.length} {monthRows.length === 1 ? 'gasto' : 'gastos'}
          </p>
        </CardContent>
      </Card>

      {byCategory.length > 0 && (
        <Card className="border-emerald-500/15">
          <CardHeader>
            <CardTitle className="text-base">Por tipo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {byCategory.map((c) => (
              <div key={c.value} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{c.label}</span>
                  <span className="font-semibold tabular-nums text-rose-600 dark:text-rose-400">{fmt(c.total)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div className="h-full rounded-full bg-rose-400" style={{ width: `${(c.total / total) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <NormalExpensesCard
        monthIndex={mi}
        expenses={monthRows}
        loading={loading}
        onDelete={async (id) => {
          if (await deleteRow('normal_expenses', id, '¿Eliminar este gasto?', 'el gasto')) refetch()
        }}
      />
    </>
  )
}

export default function GastosPage() {
  return (
    <AuthGate>
      <AppShell>
        <NormalExpenses />
      </AppShell>
    </AuthGate>
  )
}
