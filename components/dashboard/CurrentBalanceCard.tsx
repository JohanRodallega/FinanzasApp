import { Card, CardContent } from '@/components/ui/card'
import { fmt } from '@/lib/format'
import type { BalanceBreakdown } from '@/lib/finance-calc'
import { Landmark } from 'lucide-react'

export function CurrentBalanceCard({ breakdown }: { breakdown: BalanceBreakdown }) {
  const { incomes, fixedPaid, normal, installments, savings, balance } = breakdown
  const positive = balance >= 0

  return (
    <Card className={positive ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/10'}>
      <CardContent className="space-y-1 pt-4">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Landmark className="h-4 w-4" /> Saldo actual
        </p>
        <p
          className={`text-3xl font-black tabular-nums ${
            positive ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {fmt(balance)}
        </p>
        <p className="text-[11px] text-muted-foreground">
          Recibido {fmt(incomes)} − fijos pagados {fmt(fixedPaid)} − normales {fmt(normal)} − cuotas{' '}
          {fmt(installments)} − ahorrado {fmt(savings)}
        </p>
      </CardContent>
    </Card>
  )
}
