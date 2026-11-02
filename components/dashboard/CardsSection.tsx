import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { ListRow } from '@/components/shared/ListRow'
import { fmt } from '@/lib/format'
import type { CardPayment, CardTransaction, CreditCard } from '@/types/finance'
import { Banknote, CreditCard as CardIcon, ShoppingBag } from 'lucide-react'

interface CardsSectionProps {
  cards: CreditCard[]
  loadingCards: boolean
  transactions: CardTransaction[]
  loadingTransactions: boolean
  onDeleteCard: (id: string) => void
  onDeleteTransaction: (tx: CardTransaction) => void
  payments: CardPayment[]
  onDeletePayment: (payment: CardPayment) => void
}

export function CardsSection({
  cards,
  loadingCards,
  transactions,
  loadingTransactions,
  onDeleteCard,
  onDeleteTransaction,
  payments,
  onDeletePayment,
}: CardsSectionProps) {
  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
      <Card className="border-emerald-500/15">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CardIcon className="h-4 w-4 text-sky-700 dark:text-sky-400" />
            Mis tarjetas de crédito
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCards ? (
            <p className="text-sm text-muted-foreground">Cargando tarjetas...</p>
          ) : cards.length === 0 ? (
            <EmptyState icon={CardIcon} text="No hay tarjetas registradas aún." />
          ) : (
            <ul className="space-y-2">
              {cards.map((card) => {
                const balance = Number(card.current_balance ?? 0)
                const limit = Number(card.total_limit ?? 0)
                const usage = limit > 0 ? Math.round((balance / limit) * 100) : 0
                return (
                  <ListRow
                    key={card.id}
                    icon={<CardIcon className="h-5 w-5 text-sky-700 dark:text-sky-400" />}
                    title={card.name ?? card.card_alias ?? card.bank_name ?? 'Tarjeta'}
                    subtitle={`Cupo ${fmt(limit)}`}
                    amount={fmt(balance)}
                    amountClassName="text-rose-600 dark:text-rose-400"
                    secondary={`${usage}% usado`}
                    onDelete={() => onDeleteCard(card.id)}
                  />
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-emerald-500/15">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            Compras recientes con tarjeta
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTransactions ? (
            <p className="text-sm text-muted-foreground">Cargando compras...</p>
          ) : transactions.length === 0 ? (
            <EmptyState icon={ShoppingBag} text="No hay compras registradas aún." />
          ) : (
            <ul className="space-y-2">
              {transactions.map((tx) => {
                const installments = Number(tx.installments) || 1
                return (
                  <ListRow
                    key={tx.id}
                    icon={<ShoppingBag className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
                    title={tx.description}
                    subtitle={`${installments} ${installments === 1 ? 'cuota' : 'cuotas'} · ${fmt(Number(tx.amount) / installments)}/mes`}
                    amount={fmt(Number(tx.amount))}
                    amountClassName="text-purple-600 dark:text-purple-400"
                    onDelete={() => onDeleteTransaction(tx)}
                  />
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {payments.length > 0 && (
        <Card className="border-emerald-500/15 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="h-4 w-4 text-sky-700 dark:text-sky-400" />
              Pagos y adelantos a tarjetas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {payments.map((p) => {
                const card = cards.find((c) => c.id === p.card_id)
                const name = card ? (card.name ?? card.card_alias ?? card.bank_name ?? 'Tarjeta') : 'Tarjeta'
                return (
                  <ListRow
                    key={p.id}
                    icon={<Banknote className="h-5 w-5 text-sky-700 dark:text-sky-400" />}
                    title={`${p.kind === 'adelanto' ? 'Adelanto' : 'Pago'} · ${name}`}
                    subtitle={`${new Date(p.created_at).toLocaleDateString('es')}${p.note ? ` · ${p.note}` : ''}`}
                    amount={`-${fmt(Number(p.amount))}`}
                    amountClassName="text-emerald-600 dark:text-emerald-400"
                    onDelete={() => onDeletePayment(p)}
                  />
                )
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
