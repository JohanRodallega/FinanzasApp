'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addBalanceAdjustment } from '@/lib/mutations'
import { toast } from '@/lib/toast'
import { fmt } from '@/lib/format'
import { Scale } from 'lucide-react'

interface AdjustBalanceModalProps {
  calculated: number
  householdId: string | null
  onAdjusted: () => void
}

export const AdjustBalanceModal: React.FC<AdjustBalanceModalProps> = ({ calculated, householdId, onAdjusted }) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [real, setReal] = useState('')

  const realValue = parseFloat(real)
  const hasValue = Number.isFinite(realValue)
  // Redondeado a centavos para evitar residuos de punto flotante
  const delta = hasValue ? Math.round((realValue - calculated) * 100) / 100 : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasValue) return
    if (delta === 0) return toast.error('El saldo ya coincide, no hay nada que ajustar.')

    setLoading(true)
    const ok = await addBalanceAdjustment(delta, householdId, 'Cuadre de saldo')
    setLoading(false)
    if (!ok) return

    setReal('')
    setOpen(false)
    onAdjusted()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" />}>
        <Scale className="h-3.5 w-3.5" />
        <span>Cuadrar saldo</span>
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cuadrar saldo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Escribe cuánto tienes realmente en tu cuenta. La app guarda la diferencia como un ajuste y no modifica tus
            ingresos ni tus gastos.
          </p>

          <div className="space-y-2">
            <Label htmlFor="adj-real">Saldo real en tu cuenta ($)</Label>
            <Input
              id="adj-real"
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={real}
              onChange={(e) => setReal(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1 rounded-md bg-muted/50 p-3 text-sm tabular-nums">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Saldo calculado</span>
              <span>{fmt(calculated)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Ajuste a guardar</span>
              <span className={delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {delta > 0 ? '+' : delta < 0 ? '−' : ''}
                {fmt(Math.abs(delta))}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !hasValue || delta === 0}>
              {loading ? 'Guardando...' : 'Cuadrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
