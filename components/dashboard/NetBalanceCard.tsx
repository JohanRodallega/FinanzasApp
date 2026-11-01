import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SegmentBar } from '@/components/shared/SegmentBar'
import { fmt } from '@/lib/format'
import { monthLabel } from '@/lib/dates'
import { PiggyBank, TrendingDown, TrendingUp } from 'lucide-react'

interface NetBalanceCardProps {
  monthIndex: number
  totalIncomes: number
  fixed: number
  installments: number
  normal: number
}

export function NetBalanceCard({ monthIndex, totalIncomes, fixed, installments, normal }: NetBalanceCardProps) {
  const outflow = fixed + installments + normal
  const netBalance = totalIncomes - outflow
  const surplus = netBalance >= 0
  const commitmentRatio = totalIncomes > 0 ? Math.min(100, Math.round((outflow / totalIncomes) * 100)) : 0

  return (
    <Card className="border-emerald-500/15">
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            Estado financiero · {monthLabel(monthIndex)}
          </span>
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
              surplus
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}
          >
            {surplus ? 'SUPERÁVIT' : 'DÉFICIT'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div
            className={`order-first col-span-2 rounded-lg border p-3 sm:order-last sm:col-span-1 ${
              surplus ? 'border-purple-500/20 bg-purple-500/5' : 'border-rose-500/30 bg-rose-500/10'
            }`}
          >
            <p className="text-xs text-muted-foreground">{surplus ? 'Dinero libre estimado' : 'Faltante estimado'}</p>
            <p
              className={`mt-1 text-2xl font-black tabular-nums ${
                surplus ? 'text-purple-600 dark:text-purple-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {fmt(netBalance)}
            </p>
          </div>

          <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-3">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-emerald-700 dark:text-emerald-400" /> Ingresos
            </p>
            <p className="mt-1 text-base font-bold tabular-nums text-emerald-700 dark:text-emerald-400 sm:text-xl">
              +{fmt(totalIncomes)}
            </p>
          </div>

          <div className="rounded-lg border border-rose-500/10 bg-rose-500/5 p-3">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-rose-600 dark:text-rose-400" /> Gastos + cuotas
            </p>
            <p className="mt-1 text-base font-bold tabular-nums text-rose-600 dark:text-rose-400 sm:text-xl">
              -{fmt(outflow)}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Fijos {fmt(fixed)} · Cuotas {fmt(installments)} · Normales {fmt(normal)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-muted-foreground">Capacidad de ingresos comprometida</span>
            <span
              className={`font-bold tabular-nums ${
                commitmentRatio > 80 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {commitmentRatio}%
            </span>
          </div>
          <SegmentBar percent={commitmentRatio} />
        </div>
      </CardContent>
    </Card>
  )
}
