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
import { CreditCard } from '@/types/finance'
import { ShoppingBag } from 'lucide-react'

interface AddCardTransactionModalProps {
  cards: CreditCard[]
  onTransactionAdded: () => void
}

export const AddCardTransactionModal: React.FC<AddCardTransactionModalProps> = ({
  cards,
  onTransactionAdded,
}) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedCardId, setSelectedCardId] = useState<string>('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [installments, setInstallments] = useState('1')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCardId || !description || !amount) return

    setLoading(true)
    const numAmount = parseFloat(amount)

    // 1. Guardar la compra en la tabla card_transactions
    const { error: txError } = await supabase.from('card_transactions').insert([
      {
        card_id: selectedCardId,
        description,
        amount: numAmount,
        installments: parseInt(installments, 10),
      },
    ])

    if (txError) {
      console.error('Error al guardar compra:', txError.message)
      alert('Error al guardar la compra: ' + txError.message)
      setLoading(false)
      return
    }

    // 2. Obtener el saldo actual de la tarjeta seleccionada
    const selectedCard = cards.find((c) => c.id === selectedCardId)
    const currentBalance = Number(selectedCard?.current_balance || 0)

    // 3. Actualizar el saldo total acumulado de la tarjeta
    const { error: cardError } = await supabase
      .from('credit_cards')
      .update({ current_balance: currentBalance + numAmount })
      .eq('id', selectedCardId)

    setLoading(false)

    if (cardError) {
      console.error('Error al actualizar el saldo de la tarjeta:', cardError.message)
    } else {
      setDescription('')
      setAmount('')
      setInstallments('1')
      setOpen(false)
      onTransactionAdded()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={cards.length === 0}
          className="flex items-center gap-2 border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Registrar Compra</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Compra con Tarjeta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="card">Seleccionar Tarjeta</Label>
            <Select value={selectedCardId} onValueChange={setSelectedCardId}>
              <SelectTrigger>
                <SelectValue placeholder="Elige una tarjeta" />
              </SelectTrigger>
              <SelectContent>
                {cards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    {card.name} (Cupo disp: ${(Number(card.total_limit) - Number(card.current_balance || 0)).toLocaleString('es-CO')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Concepto / Establecimiento</Label>
            <Input
              id="description"
              placeholder="Ej: Supermercado, Restaurante, Computador"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto Total ($)</Label>
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
              <Label htmlFor="installments">Número de Cuotas</Label>
              <Input
                id="installments"
                type="number"
                min="1"
                max="48"
                placeholder="1"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                required
              />
            </div>
          </div>

          {amount && parseInt(installments, 10) > 1 && (
            <p className="text-xs text-muted-foreground bg-purple-50 dark:bg-purple-950/50 p-2 rounded border border-purple-200">
              💡 Cuota estimada aprox: <strong>${(parseFloat(amount) / parseInt(installments, 10)).toLocaleString('es-CO', { maximumFractionDigits: 0 })}/mes</strong> (sin contar intereses).
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white">
              {loading ? 'Guardando...' : 'Guardar Compra'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
