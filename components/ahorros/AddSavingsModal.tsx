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
import { todayStr } from '@/lib/dates'
import { PiggyBank, ArrowDownToLine } from 'lucide-react'

interface AddSavingsModalProps {
  onAdded: () => void
}

export const AddSavingsModal: React.FC<AddSavingsModalProps> = ({ onAdded }) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [kind, setKind] = useState<'ahorro' | 'retiro'>('ahorro')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayStr())
  const [note, setNote] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = parseFloat(amount)
    if (isNaN(value) || value <= 0) return

    setLoading(true)

    // user_id se completa solo con el usuario autenticado
    const { error } = await supabase.from('savings_entries').insert([
      {
        entry_date: date,
        amount: kind === 'retiro' ? -value : value,
        note: note.trim() || null,
      },
    ])

    setLoading(false)

    if (error) {
      console.error('Error al guardar el ahorro:', error.message)
      alert('Error al guardar: ' + error.message)
      return
    }

    setAmount('')
    setNote('')
    setDate(todayStr())
    setKind('ahorro')
    setOpen(false)
    onAdded()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button type="button" className="min-h-11 gap-2 sm:min-h-0" />}
      >
        <PiggyBank className="h-4 w-4" />
        <span>Registrar</span>
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Registrar movimiento de ahorro</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setKind('ahorro')}
              className={`flex h-11 items-center justify-center gap-2 rounded-md border text-sm transition-colors ${
                kind === 'ahorro'
                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400'
                  : 'border-border text-muted-foreground'
              }`}
            >
              <PiggyBank className="h-4 w-4" /> Ahorro
            </button>
            <button
              type="button"
              onClick={() => setKind('retiro')}
              className={`flex h-11 items-center justify-center gap-2 rounded-md border text-sm transition-colors ${
                kind === 'retiro'
                  ? 'border-rose-500/50 bg-rose-500/15 text-rose-400'
                  : 'border-border text-muted-foreground'
              }`}
            >
              <ArrowDownToLine className="h-4 w-4" /> Retiro
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="savings-amount">Monto ($)</Label>
            <Input
              id="savings-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="savings-date">Fecha</Label>
            <Input
              id="savings-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="savings-note">Nota (opcional)</Label>
            <Input
              id="savings-note"
              placeholder="Ej: Ahorro de quincena, fondo de emergencia"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
