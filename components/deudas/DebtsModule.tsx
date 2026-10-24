'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SegmentBar } from '@/components/shared/SegmentBar'
import { Debt } from '@/types/finance'
import { supabase } from '@/lib/supabase'
import { ownerFields } from '@/lib/scope'
import { fmt } from '@/lib/format'
import { PlusCircle, Trash2, Banknote, Landmark } from 'lucide-react'

interface DebtsModuleProps {
  debts: Debt[]
  onDebtUpdated: () => void
  householdId: string | null
}

export const DebtsModule: React.FC<DebtsModuleProps> = ({ debts, onDebtUpdated, householdId }) => {
  const [title, setTitle] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [creditor, setCreditor] = useState('')
  const [abonoInput, setAbonoInput] = useState<{ [key: string]: string }>({})

  // Guardar nueva deuda
  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !totalAmount) return

    const owner = await ownerFields(householdId)
    if (!owner) {
      alert('Tu sesión expiró. Vuelve a iniciar sesión.')
      return
    }

    const { error } = await supabase.from('debts').insert([
      {
        ...owner,
        title,
        total_amount: parseFloat(totalAmount),
        paid_amount: 0,
        creditor,
      },
    ])

    if (error) {
      console.error('Error al agregar deuda:', error.message)
      alert('Error al guardar la deuda: ' + error.message)
      return
    }

    setTitle('')
    setTotalAmount('')
    setCreditor('')
    onDebtUpdated()
  }

  // Registrar un abono a una deuda
  const handleAddPayment = async (debt: Debt) => {
    const amount = parseFloat(abonoInput[debt.id] || '0')
    if (isNaN(amount) || amount <= 0) return

    const newPaid = Math.min(debt.total_amount, Number(debt.paid_amount || 0) + amount)

    const { error } = await supabase
      .from('debts')
      .update({ paid_amount: newPaid })
      .eq('id', debt.id)

    if (!error) {
      setAbonoInput({ ...abonoInput, [debt.id]: '' })
      onDebtUpdated()
    }
  }

  // Eliminar una deuda
  const handleDeleteDebt = async (id: string) => {
    if (!window.confirm('¿Eliminar esta deuda?')) return
    const { error } = await supabase.from('debts').delete().eq('id', id)
    if (!error) onDebtUpdated()
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Formulario de registro */}
      <Card className="border-emerald-500/15">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Banknote className="h-4 w-4 text-rose-400" />
            Registrar deuda o préstamo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddDebt} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              placeholder="Descripción (ej. Préstamo libre inversión)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10"
              required
            />
            <Input
              type="number"
              inputMode="decimal"
              placeholder="Monto total ($)"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="h-10"
              required
            />
            <Input
              placeholder="Acreedor (ej. Banco / Carlos)"
              value={creditor}
              onChange={(e) => setCreditor(e.target.value)}
              className="h-10"
            />
            <Button type="submit" className="h-10 gap-2">
              <PlusCircle className="h-4 w-4" /> Registrar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de deudas con progreso */}
      <Card className="border-emerald-500/15">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Landmark className="h-4 w-4 text-rose-400" />
            Control y progreso de deudas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {debts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
              No tienes deudas o préstamos registrados en esta vista.
            </div>
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {debts.map((debt) => {
                const paid = Number(debt.paid_amount || 0)
                const total = Number(debt.total_amount)
                const pending = Math.max(0, total - paid)
                const progress = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0

                return (
                  <li
                    key={debt.id}
                    className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background/60">
                        <Landmark className="h-5 w-5 text-rose-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{debt.title}</p>
                        {debt.creditor && (
                          <p className="truncate text-xs text-muted-foreground">{debt.creditor}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums">{fmt(total)}</p>
                        <p className="text-[11px] text-muted-foreground">total</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar deuda"
                        className="h-10 w-10 shrink-0 text-muted-foreground hover:text-rose-500"
                        onClick={() => handleDeleteDebt(debt.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <SegmentBar percent={progress} colorClass="bg-emerald-400" />

                    <div className="flex justify-between gap-2 text-xs tabular-nums">
                      <span className="text-emerald-400">Abonado {fmt(paid)}</span>
                      <span className="text-rose-400">
                        Falta {fmt(pending)} ({100 - progress}%)
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder="Monto a abonar"
                        className="h-10 flex-1"
                        value={abonoInput[debt.id] || ''}
                        onChange={(e) => setAbonoInput({ ...abonoInput, [debt.id]: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                        onClick={() => handleAddPayment(debt)}
                      >
                        Abonar
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
