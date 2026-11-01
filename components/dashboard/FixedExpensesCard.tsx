import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SegmentBar } from '@/components/shared/SegmentBar'
import { EmptyState } from '@/components/shared/EmptyState'
import { ExpenseRow } from '@/components/gastos/ExpenseRow'
import { fmt } from '@/lib/format'
import { monthLabel } from '@/lib/dates'
import type { ExpenseLine } from '@/lib/finance-calc'
import { Receipt } from 'lucide-react'

interface FixedExpensesCardProps {
  monthIndex: number
  lines: ExpenseLine[]
  loading: boolean
  onToggle: (line: ExpenseLine) => void
  onEdit: (line: ExpenseLine) => void
}

export function FixedExpensesCard({ monthIndex, lines, loading, onToggle, onEdit }: FixedExpensesCardProps) {
  const total = lines.reduce((acc, l) => acc + l.amount, 0)
  const paidTotal = lines.filter((l) => l.paid).reduce((acc, l) => acc + l.amount, 0)
  const paidCount = lines.filter((l) => l.paid).length
  const paidPercent = lines.length > 0 ? Math.round((paidCount / lines.length) * 100) : 0

  return (
    <Card className="border-emerald-500/15">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-amber-700 dark:text-amber-400" />
            Gastos fijos · {monthLabel(monthIndex)}
          </span>
          {lines.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground tabular-nums">
              Pendiente{' '}
              <span className="font-semibold text-amber-700 dark:text-amber-400">{fmt(total - paidTotal)}</span>
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando gastos fijos...</p>
        ) : lines.length === 0 ? (
          <EmptyState icon={Receipt} text="No hay gastos fijos registrados aún." />
        ) : (
          <>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {paidCount} de {lines.length} pagados
                </span>
                <span className="tabular-nums">{paidPercent}%</span>
              </div>
              <SegmentBar percent={paidPercent} colorClass="bg-emerald-400" />
            </div>
            <ul className="space-y-2">
              {lines.map((line) => (
                <ExpenseRow
                  key={line.expense.id}
                  title={line.expense.title}
                  subtitle={`${line.expense.category ? `${line.expense.category} · ` : ''}Día ${line.expense.due_date}`}
                  amount={fmt(line.amount)}
                  paid={line.paid}
                  onToggle={() => onToggle(line)}
                  onEdit={() => onEdit(line)}
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
  )
}
