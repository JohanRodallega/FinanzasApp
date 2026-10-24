'use client'

import { useCallback, useEffect, useState } from 'react'
import { AuthGate } from '@/components/shared/AuthGate'
import { AppShell, useApp } from '@/components/shared/AppShell'
import { ListRow } from '@/components/shared/ListRow'
import { AddSavingsModal } from '@/components/ahorros/AddSavingsModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { fmt, fmtCompact } from '@/lib/format'
import { useHideSavings } from '@/lib/privacy'
import { currentMonthIndex, formatDate, monthIndexOf, monthLabel, monthShort } from '@/lib/dates'
import { SavingsEntry } from '@/types/finance'
import { PiggyBank, Lock, Eye, EyeOff, TrendingUp, ArrowDownToLine, CalendarDays, Trophy } from 'lucide-react'

const MASK = '••••••'

function Savings() {
  const { user } = useApp()
  const [entries, setEntries] = useState<SavingsEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [hidden, toggleHidden] = useHideSavings()

  const show = (n: number) => (hidden ? MASK : fmt(n))

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('savings_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (data) setEntries(data as SavingsEntry[])
    setLoading(false)
  }, [user.id])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este movimiento?')) return
    const { error } = await supabase.from('savings_entries').delete().eq('id', id)
    if (!error) fetchEntries()
  }

  // Cálculos
  const nowIdx = currentMonthIndex()
  const total = entries.reduce((acc, e) => acc + Number(e.amount), 0)

  const netByMonth = new Map<number, number>()
  entries.forEach((e) => {
    const idx = monthIndexOf(e.entry_date)
    netByMonth.set(idx, (netByMonth.get(idx) ?? 0) + Number(e.amount))
  })

  const firstIdx = entries.length > 0 ? Math.min(...Array.from(netByMonth.keys())) : nowIdx
  const lastIdx = Math.max(nowIdx, entries.length > 0 ? Math.max(...Array.from(netByMonth.keys())) : nowIdx)

  // Serie mes a mes (con los meses sin movimientos en cero) y acumulado
  const fullSeries: { idx: number; label: string; net: number; total: number }[] = []
  let running = 0
  for (let idx = firstIdx; idx <= lastIdx; idx++) {
    const net = netByMonth.get(idx) ?? 0
    running += net
    fullSeries.push({ idx, label: monthShort(idx), net, total: running })
  }
  const chartData = fullSeries.slice(-12)

  const thisMonth = netByMonth.get(nowIdx) ?? 0
  const monthsCount = Math.max(1, lastIdx - firstIdx + 1)
  const average = total / monthsCount
  const best = fullSeries.reduce<{ idx: number; net: number } | null>(
    (acc, s) => (acc === null || s.net > acc.net ? { idx: s.idx, net: s.net } : acc),
    null
  )

  // Movimientos agrupados por mes (más reciente primero)
  const groups = Array.from(netByMonth.keys())
    .sort((a, b) => b - a)
    .map((idx) => ({
      idx,
      net: netByMonth.get(idx) ?? 0,
      items: entries.filter((e) => monthIndexOf(e.entry_date) === idx),
    }))

  const stats = [
    { label: 'Este mes', value: show(thisMonth), icon: CalendarDays, color: 'text-emerald-400' },
    { label: 'Promedio mensual', value: show(average), icon: TrendingUp, color: 'text-sky-400' },
    {
      label: 'Mejor mes',
      value: best && best.net > 0 ? show(best.net) : '—',
      hint: best && best.net > 0 ? monthLabel(best.idx) : undefined,
      icon: Trophy,
      color: 'text-amber-400',
    },
  ]

  return (
    <>
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-3xl">
            <PiggyBank className="h-5 w-5 text-emerald-400 sm:h-7 sm:w-7" />
            Ahorros
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
            <Lock className="h-3 w-3" /> Privado: solo tú ves esta sección
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 sm:h-9 sm:w-9"
            aria-label={hidden ? 'Mostrar montos' : 'Ocultar montos'}
            title={hidden ? 'Mostrar montos' : 'Ocultar montos'}
            onClick={toggleHidden}
          >
            {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <AddSavingsModal onAdded={fetchEntries} />
        </div>
      </div>

      {/* Total */}
      <Card className="border-emerald-500/20">
        <CardContent className="space-y-1 p-4 sm:p-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Total ahorrado</p>
          <p className="text-3xl font-black tabular-nums text-emerald-400 sm:text-5xl">{show(total)}</p>
          <p className="text-xs text-muted-foreground">
            {entries.length === 0
              ? 'Aún no has registrado movimientos.'
              : `${entries.length} ${entries.length === 1 ? 'movimiento' : 'movimientos'} en ${monthsCount} ${monthsCount === 1 ? 'mes' : 'meses'}`}
          </p>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ icon: Icon, ...s }) => (
          <Card key={s.label} className="border-emerald-500/15">
            <CardContent className="space-y-1 p-3">
              <div className="flex items-center justify-between gap-1">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground sm:text-xs">
                  {s.label}
                </p>
                <Icon className={`hidden h-4 w-4 shrink-0 sm:block ${s.color}`} />
              </div>
              <p className={`truncate text-sm font-bold tabular-nums sm:text-xl ${s.color}`}>{s.value}</p>
              {s.hint && <p className="truncate text-[10px] text-muted-foreground">{s.hint}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico: ahorro por mes y acumulado */}
      {entries.length > 0 && (
        <Card className="border-emerald-500/15">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Mes a mes y acumulado
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[240px] sm:h-[300px]">
            <div className={`h-full transition ${hidden ? 'pointer-events-none select-none blur-md' : ''}`}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="currentColor" strokeOpacity={0.12} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'currentColor', fillOpacity: 0.65 }}
                  />
                  <YAxis
                    width={44}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => fmtCompact(Number(val))}
                    tick={{ fontSize: 11, fill: 'currentColor', fillOpacity: 0.65 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'currentColor', fillOpacity: 0.05 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0) return null
                      return (
                        <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                          <p className="mb-1 text-muted-foreground">{String(label)}</p>
                          {payload.map((p) => (
                            <p key={String(p.dataKey)} className="tabular-nums">
                              {String(p.name)}: <span className="font-semibold">{fmt(Number(p.value ?? 0))}</span>
                            </p>
                          ))}
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="net" name="Del mes" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {chartData.map((d) => (
                      <Cell key={d.idx} fill={d.net >= 0 ? '#34d399' : '#fb7185'} fillOpacity={0.8} />
                    ))}
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Acumulado"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Movimientos por mes */}
      <Card className="border-emerald-500/15">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4 text-sky-400" />
            Registro mensual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-center">
              <PiggyBank className="h-6 w-6 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">
                Registra tu primer ahorro con el botón de arriba.
              </p>
            </div>
          ) : (
            groups.map((g, i) => (
              <details key={g.idx} open={i === 0} className="group rounded-lg border border-border/60">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{monthLabel(g.idx)}</span>
                    <span className="block text-xs text-muted-foreground">
                      {g.items.length} {g.items.length === 1 ? 'movimiento' : 'movimientos'}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-sm font-semibold tabular-nums ${
                      g.net >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {hidden ? MASK : `${g.net >= 0 ? '+' : ''}${fmt(g.net)}`}
                  </span>
                </summary>
                <ul className="space-y-2 border-t border-border/60 p-2">
                  {g.items.map((entry) => {
                    const isWithdrawal = Number(entry.amount) < 0
                    return (
                      <ListRow
                        key={entry.id}
                        icon={
                          isWithdrawal ? (
                            <ArrowDownToLine className="h-5 w-5 text-rose-400" />
                          ) : (
                            <PiggyBank className="h-5 w-5 text-emerald-400" />
                          )
                        }
                        title={entry.note || (isWithdrawal ? 'Retiro' : 'Ahorro')}
                        subtitle={formatDate(entry.entry_date)}
                        amount={hidden ? MASK : `${isWithdrawal ? '-' : '+'}${fmt(Math.abs(Number(entry.amount)))}`}
                        amountClassName={isWithdrawal ? 'text-rose-400' : 'text-emerald-400'}
                        onDelete={() => handleDelete(entry.id)}
                      />
                    )
                  })}
                </ul>
              </details>
            ))
          )}
        </CardContent>
      </Card>
    </>
  )
}

export default function AhorrosPage() {
  return (
    <AuthGate>
      <AppShell showScope={false}>
        <Savings />
      </AppShell>
    </AuthGate>
  )
}
