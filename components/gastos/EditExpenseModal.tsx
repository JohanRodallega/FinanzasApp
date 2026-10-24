'use client'

import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { ownerFields } from '@/lib/scope'
import { monthKey, monthLabel } from '@/lib/dates'
import type { ExpenseLine } from '@/lib/finance-calc'
import { Trash2 } from 'lucide-react'

interface EditExpenseModalProps {
  line: ExpenseLine | null
  monthIndex: number
  onClose: () => void
  onSaved: () => void
  onDelete: (expenseId: string) => void
}

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  line,
  monthIndex,
  onClose,
  onSaved,
  onDelete,
}) => {
  const [amount, setAmount] = useState('')
  const [asBase, setAsBase] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (line) {
      setAmount(String(line.amount))
      setAsBase(false)
    }
  }, [line])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!line) return

    const value = parseFloat(amount)
    if (isNaN(value) || value < 0) return

    setLoading(true)

    const owner = await ownerFields(line.expense.household_id ?? null)
    if (!owner) {
      alert('Tu sesión expiró. Vuelve a iniciar sesión.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('expense_months').upsert(
      {
        expense_id: line.expense.id,
        month: monthKey(monthIndex),
        amount: value,
        paid: line.paid,
        paid_at: line.monthRow?.paid_at ?? null,
        user_id: owner.user_id,
        household_id: owner.household_id,
      },
      { onConflict: 'expense_id,month' }
    )

    if (error) {
      console.error('Error al guardar el gasto del mes:', error.message)
      alert('Error al guardar: ' + error.message)
      setLoading(false)
      return
    }

    if (asBase) {
      const { error: baseError } = await supabase
        .from('basic_expenses')
        .update({ amount: value })
        .eq('id', line.expense.id)
      if (baseError) console.error('Error al actualizar el monto base:', baseError.message)
    }

    setLoading(false)
    onSaved()
    onClose()
  }

  return (
    <Dialog open={line !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{line?.expense.title ?? 'Editar gasto'}</DialogTitle>
          <p className="text-sm text-muted-foreground">{monthLabel(monthIndex)}</p>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-amount">Monto de este mes ($)</Label>
            <Input
              id="edit-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border/60 p-3 text-sm">
            <input
              type="checkbox"
              checked={asBase}
              onChange={(e) => setAsBase(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-500"
            />
            <span>
              Usar este monto como base para los próximos meses
              <span className="block text-xs text-muted-foreground">
                Si no lo marcas, el cambio solo aplica a {monthLabel(monthIndex)}.
              </span>
            </span>
          </label>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="gap-2 text-rose-500 hover:text-rose-500"
              onClick={() => {
                if (line) {
                  onDelete(line.expense.id)
                  onClose()
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              Eliminar gasto
            </Button>

            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 sm:flex-none">
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
