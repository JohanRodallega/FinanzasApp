'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Activity, Layers } from 'lucide-react'
import { fmt, fmtCompact } from '@/lib/format'

interface FinancialChartsProps {
  totalIncomes: number
  totalExpenses: number
  totalCardDebt: number
  totalMonthlyInstallments: number
}

const COLORS = {
  income: '#34d399',
  expenses: '#fbbf24',
  installments: '#a78bfa',
  debt: '#fb7185',
}

export const FinancialCharts: React.FC<FinancialChartsProps> = ({
  totalIncomes,
  totalExpenses,
  totalCardDebt,
  totalMonthlyInstallments,
}) => {
  const barData = [
    { name: 'Ingresos', monto: totalIncomes, color: COLORS.income },
    { name: 'Gastos', monto: totalExpenses, color: COLORS.expenses },
    { name: 'Cuotas', monto: totalMonthlyInstallments, color: COLORS.installments },
    { name: 'Tarjetas', monto: totalCardDebt, color: COLORS.debt },
  ]

  const pieData = [
    { name: 'Gastos fijos', value: totalExpenses, color: COLORS.expenses },
    { name: 'Cuotas del mes', value: totalMonthlyInstallments, color: COLORS.installments },
    { name: 'Deuda tarjetas', value: totalCardDebt, color: COLORS.debt },
  ].filter((item) => item.value > 0)

  const pieTotal = pieData.reduce((acc, item) => acc + item.value, 0)

  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
      {/* Gráfico 1: Barras con degradado */}
      <Card className="border-emerald-500/15 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-emerald-400" />
            Resumen general
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[240px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <defs>
                {barData.map((d, i) => (
                  <linearGradient key={d.name} id={`bar-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={d.color} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={d.color} stopOpacity={0.15} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 4"
                vertical={false}
                stroke="currentColor"
                strokeOpacity={0.12}
              />
              <XAxis
                dataKey="name"
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
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null
                  const item = payload[0]
                  return (
                    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                      <p className="text-muted-foreground">{String(item.payload?.name ?? '')}</p>
                      <p className="font-semibold tabular-nums">{fmt(Number(item.value ?? 0))}</p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="monto" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {barData.map((d, i) => (
                  <Cell
                    key={d.name}
                    fill={`url(#bar-grad-${i})`}
                    stroke={d.color}
                    strokeOpacity={0.6}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico 2: Dona con total al centro y leyenda propia */}
      <Card className="border-emerald-500/15 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4 text-violet-400" />
            Distribución de compromisos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No hay gastos o deudas para graficar aún.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="relative h-[200px] sm:h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="62%"
                      outerRadius="88%"
                      paddingAngle={3}
                      stroke="none"
                    >
                      {pieData.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0) return null
                        const item = payload[0]
                        return (
                          <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                            <p className="text-muted-foreground">{String(item.name ?? '')}</p>
                            <p className="font-semibold tabular-nums">{fmt(Number(item.value ?? 0))}</p>
                          </div>
                        )
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total</p>
                    <p className="text-base font-bold tabular-nums sm:text-lg">{fmt(pieTotal)}</p>
                  </div>
                </div>
              </div>

              <ul className="space-y-2">
                {pieData.map((item) => (
                  <li key={item.name} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate text-muted-foreground">{item.name}</span>
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {fmt(item.value)}{' '}
                      <span className="text-xs text-muted-foreground">
                        {Math.round((item.value / pieTotal) * 100)}%
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
