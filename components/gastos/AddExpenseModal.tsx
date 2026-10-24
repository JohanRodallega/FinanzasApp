'use client'

import React, { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { ownerFields } from '@/lib/scope'
import { Receipt } from 'lucide-react'

interface AddExpenseModalProps {
  onExpenseAdded: () => void
  householdId: string | null
}

const categoryItems = [
  { value: 'Vivienda', label: 'Vivienda / Arriendo' },
  { value: 'Servicios', label: 'Servicios Públicos' },
  { value: 'Suscripciones', label: 'Suscripciones / Streaming' },
  { value: 'Educación', label: 'Educación' },
  { value: 'Otros', label: 'Otros' },
]

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ onExpenseAdded, householdId }) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Servicios')
  const [dueDate, setDueDate] = useState('5') // Día del mes para pago

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !amount) return

    setLoading(true)

    const owner = await ownerFields(householdId)
    if (!owner) {
      alert('Tu sesión expiró. Vuelve a iniciar sesión.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('basic_expenses').insert([
      {
        ...owner,
        profile_id: owner.user_id,
        is_shared: householdId !== null,
        title,
        amount: parseFloat(amount),
        category,
        due_date: parseInt(dueDate, 10),
      },
    ])

    setLoading(false)

    if (error) {
      console.error('Error al agregar gasto:', error.message)
      alert('Error al guardar el gasto: ' + error.message)
    } else {
      setTitle('')
      setAmount('')
      setOpen(false)
      onExpenseAdded()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full justify-center gap-2 border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 sm:min-h-0 sm:w-auto"
          />
        }
      >
        <Receipt className="h-4 w-4" />
        <span>Gasto fijo</span>
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Gasto Fijo / Básico</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="title">Concepto / Servicio</Label>
            <Input
              id="title"
              placeholder="Ej: Arriendo, Agua, Luz, Netflix"
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
            <Label htmlFor="category">Categoría</Label>
            <Select
              items={categoryItems}
              value={category}
              onValueChange={(val) => {
                if (val) setCategory(val)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Vivienda">Vivienda / Arriendo</SelectItem>
                <SelectItem value="Servicios">Servicios Públicos</SelectItem>
                <SelectItem value="Suscripciones">Suscripciones / Streaming</SelectItem>
                <SelectItem value="Educación">Educación</SelectItem>
                <SelectItem value="Otros">Otros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Día límite de pago del mes</Label>
            <Input
              id="dueDate"
              type="number"
              inputMode="numeric"
              min="1"
              max="31"
              placeholder="Ej: 5 (día 5 de cada mes)"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
              {loading ? 'Guardando...' : 'Guardar Gasto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
