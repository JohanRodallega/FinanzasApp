import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import { ownerFields } from '@/lib/scope'
import { monthKey } from '@/lib/dates'
import type { CardTransaction, CreditCard } from '@/types/finance'
import type { ExpenseLine } from '@/lib/finance-calc'

/** Pide confirmación y borra una fila. Devuelve true si se borró. */
export async function deleteRow(table: string, id: string, confirmText: string, what: string): Promise<boolean> {
  if (!window.confirm(confirmText)) return false
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) {
    toast.error(`No se pudo eliminar ${what}: ${error.message}`)
    return false
  }
  return true
}

/** Marca un gasto fijo como pagado o pendiente en el mes dado. Devuelve true si se guardó. */
export async function setExpensePaid(line: ExpenseLine, monthIndex: number, paid: boolean): Promise<boolean> {
  const owner = await ownerFields(line.expense.household_id ?? null)
  if (!owner) return false

  const { error } = await supabase.from('expense_months').upsert(
    {
      expense_id: line.expense.id,
      month: monthKey(monthIndex),
      amount: line.amount,
      paid,
      paid_at: paid ? new Date().toISOString() : null,
      user_id: owner.user_id,
      household_id: owner.household_id,
    },
    { onConflict: 'expense_id,month' }
  )

  if (error) toast.error('No se pudo actualizar el gasto: ' + error.message)
  return !error
}

/**
 * Borra una compra con tarjeta y baja el saldo de la tarjeta. Son dos operaciones sin
 * transacción de base de datos: se baja el saldo primero y, si el borrado falla, se restaura.
 */
export async function deleteCardTransaction(tx: CardTransaction, card: CreditCard | undefined): Promise<void> {
  if (!window.confirm('¿Eliminar esta compra?')) return

  const previousBalance = Number(card?.current_balance ?? 0)

  if (card) {
    const newBalance = Math.max(0, previousBalance - Number(tx.amount))
    const { error } = await supabase.from('credit_cards').update({ current_balance: newBalance }).eq('id', card.id)
    if (error) {
      toast.error('No se pudo actualizar el saldo de la tarjeta: ' + error.message)
      return
    }
  }

  const { error } = await supabase.from('card_transactions').delete().eq('id', tx.id)
  if (!error) return

  if (card) {
    const { error: restoreError } = await supabase
      .from('credit_cards')
      .update({ current_balance: previousBalance })
      .eq('id', card.id)
    if (restoreError) toast.error('El saldo de la tarjeta quedó desactualizado; revísalo.')
  }
  toast.error('No se pudo eliminar la compra: ' + error.message)
}
