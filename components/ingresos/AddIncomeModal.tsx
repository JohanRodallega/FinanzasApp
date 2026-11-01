'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import { ownerFields } from '@/lib/scope'
import { TrendingUp } from 'lucide-react'

interface AddIncomeModalProps {
  onIncomeAdded: () => void
  householdId: string | null
}

export const AddIncomeModal: React.FC<AddIncomeModalProps> = ({ onIncomeAdded, householdId }) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    setDate(new Date().toISOString().split('T')[0])
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !amount) return

    if (!(parseFloat(amount) > 0)) return toast.error('El monto debe ser mayor que 0.')

    setLoading(true)

    const owner = await ownerFields(householdId)
    if (!owner) {
      toast.error('Tu sesión expiró. Vuelve a iniciar sesión.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('incomes').insert([
      {
        ...owner,
        profile_id: owner.user_id,
        title,
        amount: parseFloat(amount),
        frequency: 'unico',
        date,
      },
    ])

    setLoading(false)

    if (error) {
      toast.error('Error al guardar el ingreso: ' + error.message)
    } else {
      setTitle('')
      setAmount('')
      setOpen(false)
      onIncomeAdded()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            className="min-h-11 w-full justify-center gap-2 sm:min-h-0 sm:w-auto"
          />
        }
      >
        <TrendingUp className="h-4 w-4" />
        <span>Ingreso</span>
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Ingreso</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="title">Concepto / Fuente</Label>
            <Input
              id="title"
              placeholder="Ej: Salario mensual, Freelance, Ventas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monto ($)</Label>
            <Input
              id="amount"
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
            <Label htmlFor="date">Fecha en que lo recibiste</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Cada pago cuenta solo en el mes de su fecha. Registra cada pago cuando lo recibas.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Ingreso'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
