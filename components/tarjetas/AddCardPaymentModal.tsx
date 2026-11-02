'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { addCardPayment } from '@/lib/mutations'
import { toast } from '@/lib/toast'
import { fmt } from '@/lib/format'
import type { CardPayment, CreditCard } from '@/types/finance'
import { Banknote } from 'lucide-react'

interface AddCardPaymentModalProps {
  cards: CreditCard[]
  onPaymentAdded: () => void
}

const getCardName = (card: CreditCard) => card.name ?? card.card_alias ?? card.bank_name ?? 'Tarjeta'

const KINDS = [
  { value: 'pago', label: 'Pago de la tarjeta' },
  { value: 'adelanto', label: 'Adelanto (abono extra)' },
]

export const AddCardPaymentModal: React.FC<AddCardPaymentModalProps> = ({ cards, onPaymentAdded }) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cardId, setCardId] = useState('')
  const [kind, setKind] = useState<CardPayment['kind']>('pago')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const cardItems = cards.map((c) => ({ value: c.id, label: getCardName(c) }))
  const selected = cards.find((c) => c.id === cardId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return toast.error('Elige una tarjeta.')
    const value = parseFloat(amount)
    if (!(value > 0)) return toast.error('El monto debe ser mayor que 0.')

    setLoading(true)
    const ok = await addCardPayment(selected, value, kind, note)
    setLoading(false)
    if (!ok) return

    setAmount('')
    setNote('')
    setOpen(false)
    onPaymentAdded()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        disabled={cards.length === 0}
        render={
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full justify-center gap-2 border-sky-500 text-sky-700 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950 sm:min-h-0 sm:w-auto"
          />
        }
      >
        <Banknote className="h-4 w-4" />
        <span>Pago tarjeta</span>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pagar tarjeta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Tarjeta</Label>
            <Select items={cardItems} value={cardId || null} onValueChange={(v) => setCardId(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Elige una tarjeta" />
              </SelectTrigger>
              <SelectContent>
                {cards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    {getCardName(card)} (Deuda: {fmt(Number(card.current_balance || 0))})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select items={KINDS} value={kind} onValueChange={(v) => setKind((v as CardPayment['kind']) ?? 'pago')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-amount">Monto ($)</Label>
            <Input
              id="payment-amount"
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
            <Label htmlFor="payment-note">Nota (opcional)</Label>
            <Input id="payment-note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-sky-700 text-white hover:bg-sky-800">
              {loading ? 'Guardando...' : 'Guardar pago'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
