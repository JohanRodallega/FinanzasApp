import { Card, CardContent } from '@/components/ui/card'
import { fmt } from '@/lib/format'
import type { BalanceBreakdown } from '@/lib/finance-calc'
import { AdjustBalanceModal } from '@/components/dashboard/AdjustBalanceModal'
import { Landmark } from 'lucide-react'

interface CurrentBalanceCardProps {
  breakdown: BalanceBreakdown
  householdId: string | null
  onAdjusted: () => void
}

export function CurrentBalanceCard({ breakdown, householdId, onAdjusted }: CurrentBalanceCardProps) {
  const { balance } = breakdown
  const positive = balance >= 0

  return (
    <Card className={positive ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/10'}>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Landmark className="h-4 w-4" /> Saldo actual
          </p>
          <AdjustBalanceModal calculated={balance} householdId={householdId} onAdjusted={onAdjusted} />
        </div>
        <p
          className={`text-3xl font-black tabular-nums ${
            positive ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {fmt(balance)}
        </p>
      </CardContent>
    </Card>
  )
}
