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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { Plus } from 'lucide-react'

interface AddIncomeModalProps {
  onIncomeAdded: () => void
  currentProfile: 'me' | 'partner' | 'shared'
}

export const AddIncomeModal: React.FC<AddIncomeModalProps> = ({
  onIncomeAdded,
  currentProfile,
}) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<'mensual' | 'quincenal' | 'unico'>('mensual')
  const [date, setDate] = useState('')

  useEffect(() => {
    setDate(new Date().toISOString().split('T')[0])
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !amount) return

    setLoading(true)

    const profileId = currentProfile === 'partner' 
      ? 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' 
      : 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

    const { error } = await supabase.from('incomes').insert([
      {
        profile_id: profileId,
        title,
        amount: parseFloat(amount),
        frequency,
        date,
      },
    ])

    setLoading(false)

    if (error) {
      console.error('Error al agregar ingreso:', error.message)
      alert('Error al guardar el ingreso: ' + error.message)
    } else {
      setTitle('')
      setAmount('')
      setOpen(false)
      onIncomeAdded()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Agregar Ingreso</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
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
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frecuencia</Label>
            <Select
              value={frequency}
              onValueChange={(val: 'mensual' | 'quincenal' | 'unico') => setFrequency(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona frecuencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensual">Mensual</SelectItem>
                <SelectItem value="quincenal">Quincenal</SelectItem>
                <SelectItem value="unico">Único / Ocasional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Fecha de Ingreso</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
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
