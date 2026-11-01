'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NORMAL_CATEGORIES } from '@/components/gastos-normales/categories'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import { ownerFields } from '@/lib/scope'
import { todayStr } from '@/lib/dates'
import { ShoppingCart } from 'lucide-react'

interface AddNormalExpenseModalProps {
  onAdded: () => void
  householdId: string | null
}

export const AddNormalExpenseModal: React.FC<AddNormalExpenseModalProps> = ({ onAdded, householdId }) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Tienda')
  const [date, setDate] = useState(todayStr())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !amount) return

    const value = parseFloat(amount)
    if (!(value > 0)) return toast.error('El monto debe ser mayor que 0.')

    setLoading(true)
    const owner = await ownerFields(householdId)
    if (!owner) {
      toast.error('Tu sesión expiró. Vuelve a iniciar sesión.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('normal_expenses').insert([
      {
        user_id: owner.user_id,
        household_id: owner.household_id,
        title: title.trim(),
        amount: value,
        category,
        expense_date: date,
      },
    ])
    setLoading(false)

    if (error) {
      const missing = error.code === 'PGRST205'
      toast.error(
        missing
          ? 'Falta crear la tabla normal_expenses en Supabase (supabase/migrations).'
          : 'Error al guardar el gasto: ' + error.message
      )
      return
    }

    setTitle('')
    setAmount('')
    setDate(todayStr())
    setOpen(false)
    onAdded()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full justify-center gap-2 border-rose-500 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 sm:min-h-0 sm:w-auto"
          />
        }
      >
        <ShoppingCart className="h-4 w-4" />
        <span>Gasto normal</span>
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar gasto normal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="ne-title">Descripción</Label>
            <Input
              id="ne-title"
              placeholder="Ej: Transferencia a Carlos, Éxito, Farmacia"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ne-amount">Monto ($)</Label>
            <Input
              id="ne-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ne-category">Tipo</Label>
            <Select
              items={NORMAL_CATEGORIES}
              value={category}
              onValueChange={(val) => {
                if (val) setCategory(val)
              }}
            >
              <SelectTrigger id="ne-category">
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                {NORMAL_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ne-date">Fecha</Label>
            <Input id="ne-date" type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} required />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-rose-600 text-white hover:bg-rose-700">
              {loading ? 'Guardando...' : 'Guardar gasto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
