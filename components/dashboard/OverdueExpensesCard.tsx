import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExpenseRow } from '@/components/gastos/ExpenseRow'
import { fmt } from '@/lib/format'
import { monthLongName } from '@/lib/dates'
import type { OverdueLine } from '@/lib/finance-calc'
import { AlertTriangle } from 'lucide-react'

interface OverdueExpensesCardProps {
  lines: OverdueLine[]
  onToggle: (line: OverdueLine) => void
  onEdit: (line: OverdueLine) => void
}

export function OverdueExpensesCard({ lines, onToggle, onEdit }: OverdueExpensesCardProps) {
  if (lines.length === 0) return null

  const total = lines.reduce((acc, l) => acc + l.amount, 0)
  const months = Array.from(new Set(lines.map((l) => l.monthIndex))).sort((a, b) => b - a)

  return (
    <Card className="border-rose-500/30 bg-rose-500/5">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            Pagos atrasados
          </span>
          <span className="text-xs font-normal text-muted-foreground tabular-nums">
            Pendiente <span className="font-semibold text-rose-600 dark:text-rose-400">{fmt(total)}</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {months.map((m) => (
          <div key={m} className="space-y-2">
            <p className="text-xs font-medium capitalize text-muted-foreground">{monthLongName(m)}</p>
            <ul className="space-y-2">
              {lines
                .filter((l) => l.monthIndex === m)
                .map((line) => (
                  <ExpenseRow
                    key={`${line.expense.id}-${m}`}
                    title={line.expense.title}
                    subtitle={`${line.expense.category ? `${line.expense.category} · ` : ''}Vencía el día ${line.expense.due_date}`}
                    amount={fmt(line.amount)}
                    paid={false}
                    onToggle={() => onToggle(line)}
                    onEdit={() => onEdit(line)}
                  />
                ))}
            </ul>
          </div>
        ))}
        <p className="text-[11px] text-muted-foreground">
          Toca la casilla cuando pagues. El pago se descuenta de tu saldo en ese momento.
        </p>
      </CardContent>
    </Card>
  )
}
