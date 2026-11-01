import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { ListRow } from '@/components/shared/ListRow'
import { fmt } from '@/lib/format'
import type { Income } from '@/types/finance'
import { TrendingUp, Wallet } from 'lucide-react'

const frequencyLabel: Record<string, string> = {
  mensual: 'Mensual',
  quincenal: 'Quincenal (2 pagos al mes)',
  unico: 'Único / Ocasional',
}

interface IncomeHistoryCardProps {
  incomes: Income[]
  loading: boolean
  onDelete: (id: string) => void
}

export function IncomeHistoryCard({ incomes, loading, onDelete }: IncomeHistoryCardProps) {
  return (
    <Card className="border-emerald-500/15">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
          Historial de ingresos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando ingresos...</p>
        ) : incomes.length === 0 ? (
          <EmptyState icon={Wallet} text="No hay ingresos registrados aún." />
        ) : (
          <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {incomes.map((income) => (
              <ListRow
                key={income.id}
                icon={<TrendingUp className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />}
                title={income.title}
                subtitle={frequencyLabel[income.frequency] ?? income.frequency}
                amount={fmt(Number(income.amount))}
                amountClassName="text-emerald-700 dark:text-emerald-400"
                onDelete={() => onDelete(income.id)}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
