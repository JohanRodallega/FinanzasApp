'use client'

import { useState, useEffect, useCallback } from 'react'
import { Navbar } from '@/components/shared/Navbar'
import { AddIncomeModal } from '@/components/ingresos/AddIncomeModal'
import { AddExpenseModal } from '@/components/gastos/AddExpenseModal'
import { AddCreditCardModal } from '@/components/tarjetas/AddCreditCardModal'
import { AddCardTransactionModal } from '@/components/tarjetas/AddCardTransactionModal'
import { DebtsModule } from '@/components/deudas/DebtsModule'
import { FinancialCharts } from '@/components/dashboard/FinancialCharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { supabase } from '@/lib/supabase'
import { Income, BasicExpense, CreditCard, CardTransaction, Debt } from '@/types/finance'
import { DollarSign, CreditCard as CardIcon, Receipt, TrendingDown, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  const [activeProfile, setActiveProfile] = useState<'me' | 'partner' | 'shared'>('me')

  // 1. Declaración de Estados
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loadingIncomes, setLoadingIncomes] = useState(true)

  const [expenses, setExpenses] = useState<BasicExpense[]>([])
  const [loadingExpenses, setLoadingExpenses] = useState(true)

  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [loadingCards, setLoadingCards] = useState(true)

  const [transactions, setTransactions] = useState<CardTransaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(true)

  const [debts, setDebts] = useState<Debt[]>([])
  const [loadingDebts, setLoadingDebts] = useState(true)

  // 2. Funciones de Carga de Datos con Filtro de Perfil
  const fetchIncomes = useCallback(async () => {
    setLoadingIncomes(true)
    const { data } = await supabase
      .from('incomes')
      .select('*')
      .eq('profile', activeProfile)
      .order('created_at', { ascending: false })
    if (data) setIncomes(data as Income[])
    setLoadingIncomes(false)
  }, [activeProfile])

  const fetchExpenses = useCallback(async () => {
    setLoadingExpenses(true)
    const { data } = await supabase
      .from('basic_expenses')
      .select('*')
      .eq('profile', activeProfile)
      .order('created_at', { ascending: false })
    if (data) setExpenses(data as BasicExpense[])
    setLoadingExpenses(false)
  }, [activeProfile])

  const fetchCreditCards = useCallback(async () => {
    setLoadingCards(true)
    const { data } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('profile', activeProfile)
      .order('created_at', { ascending: false })
    if (data) setCreditCards(data as CreditCard[])
    setLoadingCards(false)
  }, [activeProfile])

  const fetchTransactions = useCallback(async () => {
    setLoadingTransactions(true)
    const { data } = await supabase
      .from('card_transactions')
      .select('*')
      .eq('profile', activeProfile)
      .order('created_at', { ascending: false })
    if (data) setTransactions(data as CardTransaction[])
    setLoadingTransactions(false)
  }, [activeProfile])

  const fetchDebts = useCallback(async () => {
    setLoadingDebts(true)
    const { data } = await supabase
      .from('debts')
      .select('*')
      .eq('profile', activeProfile)
      .order('created_at', { ascending: false })
    if (data) setDebts(data as Debt[])
    setLoadingDebts(false)
  }, [activeProfile])

  const fetchAllData = useCallback(() => {
    fetchIncomes()
    fetchExpenses()
    fetchCreditCards()
    fetchTransactions()
    fetchDebts()
  }, [fetchIncomes, fetchExpenses, fetchCreditCards, fetchTransactions, fetchDebts])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData, activeProfile])

  // 3. Funciones de Eliminación
  const handleDeleteIncome = async (id: string) => {
    const { error } = await supabase.from('incomes').delete().eq('id', id)
    if (!error) fetchIncomes()
  }

  const handleDeleteExpense = async (id: string) => {
    const { error } = await supabase.from('basic_expenses').delete().eq('id', id)
    if (!error) fetchExpenses()
  }

  const handleDeleteCard = async (id: string) => {
    const { error } = await supabase.from('credit_cards').delete().eq('id', id)
    if (!error) fetchCreditCards()
  }

  const handleDeleteTransaction = async (tx: CardTransaction) => {
    const { error } = await supabase.from('card_transactions').delete().eq('id', tx.id)
    
    if (!error) {
      const card = creditCards.find((c) => c.id === tx.card_id)
      if (card) {
        const newBalance = Math.max(0, Number(card.current_balance || 0) - Number(tx.amount))
        await supabase.from('credit_cards').update({ current_balance: newBalance }).eq('id', card.id)
      }
      fetchAllData()
    }
  }

  // 4. Cálculos y Totales Financieros
  const totalIncomes = incomes.reduce((acc, curr) => acc + Number(curr.amount), 0)
  const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0)
  const totalCardDebt = creditCards.reduce((acc, curr) => acc + Number(curr.current_balance || 0), 0)

  // Estimación mensual de cuotas de tarjeta (Monto / Cuotas)
  const totalMonthlyInstallments = transactions.reduce((acc, curr) => {
    const installments = Number(curr.installments) || 1
    return acc + (Number(curr.amount) / installments)
  }, 0)

  const totalMonthlyOutflow = totalExpenses + totalMonthlyInstallments
  const netBalance = totalIncomes - totalMonthlyOutflow
  const commitmentRatio = totalIncomes > 0 
    ? Math.min(100, Math.round((totalMonthlyOutflow / totalIncomes) * 100)) 
    : 0

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Navbar currentView={activeProfile} onViewChange={setActiveProfile} />

      <main className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard de Finanzas</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona tus ingresos, gastos fijos, tarjetas y compras a cuotas.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AddIncomeModal onIncomeAdded={fetchAllData} currentProfile={activeProfile} />
            <AddExpenseModal onExpenseAdded={fetchAllData} currentProfile={activeProfile} />
            <AddCreditCardModal onCardAdded={fetchAllData} currentProfile={activeProfile} />
            <AddCardTransactionModal cards={creditCards} onTransactionAdded={fetchAllData} />
          </div>
        </div>

        {/* Tarjetas resumen KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                ${totalIncomes.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Total acumulado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Gastos Básicos Fijos</CardTitle>
              <Receipt className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                ${totalExpenses.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Costos fijos mensuales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Deuda en Tarjetas</CardTitle>
              <TrendingDown className="h-4 w-4 text-rose-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600">
                ${totalCardDebt.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Uso acumulado de tarjetas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tarjetas de Crédito</CardTitle>
              <CardIcon className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{creditCards.length}</div>
              <p className="text-xs text-muted-foreground">Tarjetas registradas</p>
            </CardContent>
          </Card>
        </div>

        {/* Sección de Balance Neto y Salud Financiera */}
        <Card className="border-l-4 border-l-purple-500 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center justify-between">
              <span>Estado Financiero Neto (Mensual)</span>
              <span className={`text-sm px-2.5 py-1 rounded-full font-semibold ${
                netBalance >= 0 
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
              }`}>
                {netBalance >= 0 ? 'EN POSITIVO (SUPERÁVIT)' : 'EN NEGATIVO (DÉFICIT)'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Ingresos */}
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-xs text-muted-foreground font-medium">Ingresos Totales</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  +${totalIncomes.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Compromisos del Mes */}
              <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/10">
                <p className="text-xs text-muted-foreground font-medium">Gastos + Cuotas del Mes</p>
                <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                  -${totalMonthlyOutflow.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  (Fijos: ${totalExpenses.toLocaleString('es-CO')} \vert{} Cuotas:${totalMonthlyInstallments.toLocaleString('es-CO')})
                </span>
              </div>

              {/* Balance Disponible */}
              <div className={`p-3 rounded-lg border ${
                netBalance >= 0 
                  ? 'bg-purple-500/5 border-purple-500/20' 
                  : 'bg-rose-500/10 border-rose-500/30'
              }`}>
                <p className="text-xs text-muted-foreground font-medium">
                  {netBalance >= 0 ? 'Dinero Libre Estimado' : 'Faltante Estimado'}
                </p>
                <p className={`text-2xl font-black mt-1 ${
                  netBalance >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  ${netBalance.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Barra de Porcentaje de Compromiso */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground">Capacidad de Ingresos Comprometida:</span>
                <span className={commitmentRatio > 80 ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
                  {commitmentRatio}%
                </span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    commitmentRatio > 80 ? 'bg-rose-500' : commitmentRatio > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, commitmentRatio)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sección de Gráficos Financieros */}
        <FinancialCharts
          totalIncomes={totalIncomes}
          totalExpenses={totalExpenses}
          totalCardDebt={totalCardDebt}
        />

        {/* Sección de Tarjetas de Crédito y Registro de Compras */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Listado de Tarjetas */}
          <Card>
            <CardHeader>
              <CardTitle>Mis Tarjetas de Crédito</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCards ? (
                <p className="text-sm text-muted-foreground">Cargando tarjetas...</p>
              ) : creditCards.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No hay tarjetas registradas aún.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarjeta</TableHead>
                      <TableHead>Deuda / Cupo</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creditCards.map((card) => (
                      <TableRow key={card.id}>
                        <TableCell className="font-medium">{card.name}</TableCell>
                        <TableCell>
                          <span className="text-rose-600 font-semibold">
                            ${Number(card.current_balance || 0).toLocaleString('es-CO')}
                          </span>
                          <span className="text-xs text-muted-foreground block">
                            de ${Number(card.total_limit).toLocaleString('es-CO')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteCard(card.id)}>
                            <Trash2 className="h-4 w-4 text-rose-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Historial de Compras con Tarjeta */}
          <Card>
            <CardHeader>
              <CardTitle>Compras Recientes con Tarjeta</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTransactions ? (
                <p className="text-sm text-muted-foreground">Cargando compras...</p>
              ) : transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No hay compras registradas aún.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Cuotas</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium">{tx.description}</TableCell>
                        <TableCell>{tx.installments} {tx.installments === 1 ? 'cuota' : 'cuotas'}</TableCell>
                        <TableCell className="text-right text-purple-600 font-semibold">
                          ${Number(tx.amount).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteTransaction(tx)}>
                            <Trash2 className="h-4 w-4 text-rose-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Grilla con Historiales de Ingresos y Gastos */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Tabla de Historial de Ingresos */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Ingresos</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingIncomes ? (
                <p className="text-sm text-muted-foreground">Cargando ingresos...</p>
              ) : incomes.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No hay ingresos registrados aún.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Frecuencia</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomes.map((income) => (
                      <TableRow key={income.id}>
                        <TableCell className="font-medium">{income.title}</TableCell>
                        <TableCell className="capitalize">{income.frequency}</TableCell>
                        <TableCell className="text-right text-emerald-600 font-semibold">
                          ${Number(income.amount).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteIncome(income.id)}>
                            <Trash2 className="h-4 w-4 text-rose-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Tabla de Historial de Gastos Fijos */}
          <Card>
            <CardHeader>
              <CardTitle>Gastos Básicos Fijos</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingExpenses ? (
                <p className="text-sm text-muted-foreground">Cargando gastos fijos...</p>
              ) : expenses.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No hay gastos fijos registrados aún.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Día de Pago</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">{expense.title}</TableCell>
                        <TableCell>Día {expense.due_date}</TableCell>
                        <TableCell className="text-right text-amber-600 font-semibold">
                          ${Number(expense.amount).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(expense.id)}>
                            <Trash2 className="h-4 w-4 text-rose-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Módulo de Deudas y Préstamos */}
        <DebtsModule
          debts={debts}
          onDebtUpdated={fetchAllData}
          currentProfile={activeProfile}
        />
      </main>
    </div>
  )
}
