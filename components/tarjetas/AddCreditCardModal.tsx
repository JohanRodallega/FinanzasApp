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
import { supabase } from '@/lib/supabase'
import { ownerFields } from '@/lib/scope'
import { CreditCard } from 'lucide-react'

interface AddCreditCardModalProps {
  onCardAdded: () => void
  householdId: string | null
}

export const AddCreditCardModal: React.FC<AddCreditCardModalProps> = ({ onCardAdded, householdId }) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [totalLimit, setTotalLimit] = useState('')
  const [currentBalance, setCurrentBalance] = useState('')
  const [closingDay, setClosingDay] = useState('15')
  const [dueDay, setDueDay] = useState('5')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !totalLimit) return

    setLoading(true)

    const owner = await ownerFields(householdId)
    if (!owner) {
      alert('Tu sesión expiró. Vuelve a iniciar sesión.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('credit_cards').insert([
      {
        ...owner,
        profile_id: owner.user_id,
        name,
        total_limit: parseFloat(totalLimit),
        current_balance: currentBalance ? parseFloat(currentBalance) : 0,
        closing_day: parseInt(closingDay, 10),
        due_day: parseInt(dueDay, 10),
      },
    ])

    setLoading(false)

    if (error) {
      console.error('Error al agregar tarjeta:', error.message)
      alert('Error al guardar la tarjeta: ' + error.message)
    } else {
      setName('')
      setTotalLimit('')
      setCurrentBalance('')
      setOpen(false)
      onCardAdded()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full justify-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 sm:min-h-0 sm:w-auto"
          />
        }
      >
        <CreditCard className="h-4 w-4" />
        <span>Tarjeta</span>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Nueva Tarjeta de Crédito</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre / Banco</Label>
            <Input
              id="name"
              placeholder="Ej: Nu Bank, Visa Bancolombia, RappiCard"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="totalLimit">Cupo Total ($)</Label>
              <Input
                id="totalLimit"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0.00"
                value={totalLimit}
                onChange={(e) => setTotalLimit(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentBalance">Deuda Actual ($)</Label>
              <Input
                id="currentBalance"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0.00"
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="closingDay">Día de Corte</Label>
              <Input
                id="closingDay"
                type="number"
                inputMode="numeric"
                min="1"
                max="31"
                placeholder="Ej: 15"
                value={closingDay}
                onChange={(e) => setClosingDay(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDay">Día Límite de Pago</Label>
              <Input
                id="dueDay"
                type="number"
                inputMode="numeric"
                min="1"
                max="31"
                placeholder="Ej: 5"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? 'Guardando...' : 'Guardar Tarjeta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
