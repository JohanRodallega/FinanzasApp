import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import { ownerFields } from '@/lib/scope'
import { monthKey } from '@/lib/dates'
import type { CardPayment, CardTransaction, CreditCard } from '@/types/finance'
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

/** Guarda la diferencia entre el saldo calculado y el saldo real de la cuenta. Devuelve true si se guardó. */
export async function addBalanceAdjustment(delta: number, householdId: string | null, note?: string): Promise<boolean> {
  const owner = await ownerFields(householdId)
  if (!owner) {
    toast.error('Tu sesión expiró. Vuelve a iniciar sesión.')
    return false
  }

  const { error } = await supabase.from('balance_adjustments').insert([
    { user_id: owner.user_id, household_id: owner.household_id, amount: delta, note: note?.trim() || null },
  ])

  if (error) {
    const missing = error.code === 'PGRST205'
    toast.error(
      missing
        ? 'Falta crear la tabla balance_adjustments en Supabase (supabase/migrations).'
        : 'No se pudo guardar el ajuste: ' + error.message
    )
  }
  return !error
}

/**
 * Registra un pago o adelanto a una tarjeta y baja su saldo. Son dos operaciones sin transacción:
 * si falla la actualización del saldo se deshace el pago. Devuelve true si se guardó.
 */
export async function addCardPayment(
  card: CreditCard,
  amount: number,
  kind: CardPayment['kind'],
  note?: string
): Promise<boolean> {
  const owner = await ownerFields(card.household_id ?? null)
  if (!owner) {
    toast.error('Tu sesión expiró. Vuelve a iniciar sesión.')
    return false
  }

  const { data: inserted, error } = await supabase
    .from('card_payments')
    .insert([
      {
        user_id: owner.user_id,
        household_id: owner.household_id,
        card_id: card.id,
        amount,
        kind,
        note: note?.trim() || null,
      },
    ])
    .select('id')
    .single()

  if (error) {
    toast.error(
      error.code === 'PGRST205'
        ? 'Falta crear la tabla card_payments en Supabase (supabase/migrations).'
        : 'No se pudo guardar el pago: ' + error.message
    )
    return false
  }

  const newBalance = Math.max(0, Number(card.current_balance ?? 0) - amount)
  const { error: cardError } = await supabase.from('credit_cards').update({ current_balance: newBalance }).eq('id', card.id)
  if (cardError) {
    await supabase.from('card_payments').delete().eq('id', inserted.id)
    toast.error('No se pudo actualizar el saldo de la tarjeta: ' + cardError.message)
    return false
  }
  return true
}

/** Borra un pago a tarjeta y devuelve ese monto a la deuda de la tarjeta. */
export async function deleteCardPayment(payment: CardPayment, card: CreditCard | undefined): Promise<boolean> {
  if (!window.confirm('¿Eliminar este pago? La deuda de la tarjeta volverá a subir.')) return false

  const previousBalance = Number(card?.current_balance ?? 0)
  if (card) {
    const { error } = await supabase
      .from('credit_cards')
      .update({ current_balance: previousBalance + Number(payment.amount) })
      .eq('id', card.id)
    if (error) {
      toast.error('No se pudo actualizar el saldo de la tarjeta: ' + error.message)
      return false
    }
  }

  const { error } = await supabase.from('card_payments').delete().eq('id', payment.id)
  if (error) {
    if (card) await supabase.from('credit_cards').update({ current_balance: previousBalance }).eq('id', card.id)
    toast.error('No se pudo eliminar el pago: ' + error.message)
    return false
  }
  return true
}
