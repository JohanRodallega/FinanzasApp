import { Card, CardContent } from '@/components/ui/card'
import { fmt } from '@/lib/format'
import { Wallet, CreditCard as CardIcon, Receipt, TrendingDown } from 'lucide-react'

interface KpiGridProps {
  totalIncomes: number
  totalExpenses: number
  paidCount: number
  expenseCount: number
  totalCardDebt: number
  cardCount: number
}

export function KpiGrid({ totalIncomes, totalExpenses, paidCount, expenseCount, totalCardDebt, cardCount }: KpiGridProps) {
  const kpis = [
    { label: 'Ingresos', value: fmt(totalIncomes), hint: 'Recibido este mes', icon: Wallet, color: 'text-emerald-700 dark:text-emerald-400' },
    {
      label: 'Gastos fijos',
      value: fmt(totalExpenses),
      hint: `${paidCount}/${expenseCount} pagados`,
      icon: Receipt,
      color: 'text-amber-700 dark:text-amber-400',
    },
    { label: 'Deuda tarjetas', value: fmt(totalCardDebt), hint: 'Uso acumulado', icon: TrendingDown, color: 'text-rose-600 dark:text-rose-400' },
    { label: 'Tarjetas', value: String(cardCount), hint: 'Registradas', icon: CardIcon, color: 'text-sky-700 dark:text-sky-400' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {kpis.map(({ icon: Icon, ...kpi }) => (
        <Card key={kpi.label} className="border-emerald-500/15">
          <CardContent className="space-y-1 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground sm:text-xs">{kpi.label}</p>
              <Icon className={`h-4 w-4 shrink-0 ${kpi.color}`} />
            </div>
            <p className={`truncate text-lg font-bold tabular-nums sm:text-2xl ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[11px] text-muted-foreground sm:text-xs">{kpi.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
