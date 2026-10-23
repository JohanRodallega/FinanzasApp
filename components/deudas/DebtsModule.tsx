'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Debt } from '@/types/finance'
import { supabase } from '@/lib/supabase'
import { ownerFields } from '@/lib/scope'
import { PlusCircle, Trash2, Banknote } from 'lucide-react'

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
    const { error } = await supabase.from('debts').delete().eq('id', id)
    if (!error) onDebtUpdated()
  }

  return (
    <div className="space-y-6">
      {/* Formulario de Registro Rápido */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Banknote className="h-5 w-5 text-rose-500" />
            Registrar Nueva Deuda / Préstamo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddDebt} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Descripción (ej. Préstamo Libre Inversión)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Input
              type="number"
              placeholder="Monto Total ($)"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              required
            />
            <Input
              placeholder="Acreedor / Entidad (ej. Banco / Carlos)"
              value={creditor}
              onChange={(e) => setCreditor(e.target.value)}
            />
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
              <PlusCircle className="mr-2 h-4 w-4" /> Registrar Deuda
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Deudas con Barra de Progreso */}
      <Card>
        <CardHeader>
          <CardTitle>Control y Progreso de Deudas</CardTitle>
        </CardHeader>
        <CardContent>
          {debts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No tienes deudas o préstamos registrados en esta vista.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deuda / Entidad</TableHead>
                  <TableHead>Monto Total</TableHead>
                  <TableHead>Progreso de Pago</TableHead>
                  <TableHead>Abonar</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debts.map((debt) => {
                  const paid = Number(debt.paid_amount || 0)
                  const total = Number(debt.total_amount)
                  const pending = total - paid
                  const progressPercentage = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0

                  return (
                    <TableRow key={debt.id}>
                      <TableCell>
                        <p className="font-semibold">{debt.title}</p>
                        {debt.creditor && (
                          <span className="text-xs text-muted-foreground block">{debt.creditor}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${total.toLocaleString('es-CO')}
                      </TableCell>
                      <TableCell className="w-1/3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-emerald-500 font-bold">Abonado: ${paid.toLocaleString('es-CO')}</span>
                            <span className="text-rose-500">Falta: ${pending.toLocaleString('es-CO')} ({100 - progressPercentage}%)</span>
                          </div>
                          {/* Barra de Progreso Moderna */}
                          <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 transition-all duration-500"
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Monto $"
                            className="w-28 h-8 text-xs"
                            value={abonoInput[debt.id] || ''}
                            onChange={(e) =>
                              setAbonoInput({ ...abonoInput, [debt.id]: e.target.value })
                            }
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
                            onClick={() => handleAddPayment(debt)}
                          >
                            Abonar
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteDebt(debt.id)}>
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
