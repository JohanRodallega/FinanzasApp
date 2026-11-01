import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { ListRow } from '@/components/shared/ListRow'
import { NORMAL_CATEGORIES } from '@/components/gastos-normales/categories'
import { fmt } from '@/lib/format'
import { formatDate, monthLabel } from '@/lib/dates'
import type { NormalExpense } from '@/types/finance'
import { ArrowRight, ShoppingCart } from 'lucide-react'

const categoryLabel = (value: string) => NORMAL_CATEGORIES.find((c) => c.value === value)?.label ?? value

interface NormalExpensesCardProps {
  monthIndex: number
  expenses: NormalExpense[]
  loading: boolean
  onDelete: (id: string) => void
  /** Muestra solo los más recientes y un enlace a la página completa. */
  limit?: number
}

export function NormalExpensesCard({ monthIndex, expenses, loading, onDelete, limit }: NormalExpensesCardProps) {
  const total = expenses.reduce((acc, e) => acc + Number(e.amount), 0)
  const visible = limit ? expenses.slice(0, limit) : expenses

  return (
    <Card className="border-emerald-500/15">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            Gastos normales · {monthLabel(monthIndex)}
          </span>
          {expenses.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground tabular-nums">
              Total <span className="font-semibold text-rose-600 dark:text-rose-400">{fmt(total)}</span>
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando gastos...</p>
        ) : expenses.length === 0 ? (
          <EmptyState icon={ShoppingCart} text="No hay gastos normales este mes." />
        ) : (
          <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {visible.map((e) => (
              <ListRow
                key={e.id}
                icon={<ShoppingCart className="h-5 w-5 text-rose-600 dark:text-rose-400" />}
                title={e.title}
                subtitle={`${categoryLabel(e.category)} · ${formatDate(e.expense_date)}`}
                amount={fmt(Number(e.amount))}
                amountClassName="text-rose-600 dark:text-rose-400"
                onDelete={() => onDelete(e.id)}
              />
            ))}
          </ul>
        )}
        {limit && expenses.length > limit && (
          <Link
            href="/gastos"
            className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:underline dark:text-emerald-400"
          >
            Ver todos ({expenses.length}) <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
