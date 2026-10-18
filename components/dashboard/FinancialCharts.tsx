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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

interface FinancialChartsProps {
  totalIncomes: number
  totalExpenses: number
  totalCardDebt: number
}

const COLORS = ['#f59e0b', '#f43f5e'] // Ámbar para Gastos, Rosa para Deuda

export const FinancialCharts: React.FC<FinancialChartsProps> = ({
  totalIncomes,
  totalExpenses,
  totalCardDebt,
}) => {
  // Datos para el gráfico de barras
  const barData = [
    {
      name: 'Ingresos',
      monto: totalIncomes,
      fill: '#10b981', // Verde
    },
    {
      name: 'Gastos Fijos',
      monto: totalExpenses,
      fill: '#f59e0b', // Ámbar
    },
    {
      name: 'Deuda Tarjetas',
      monto: totalCardDebt,
      fill: '#f43f5e', // Rosa
    },
  ]

  // Datos para el gráfico de dona
  const pieData = [
    { name: 'Gastos Fijos', value: totalExpenses },
    { name: 'Deuda Tarjetas', value: totalCardDebt },
  ].filter((item) => item.value > 0)

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Gráfico 1: Comparativa General de Barras */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Resumen General de Finanzas
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
              <XAxis dataKey="name" tickLine={false} />
              <YAxis
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Monto']}
                contentStyle={{ borderRadius: '8px' }}
              />
              <Bar dataKey="monto" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico 2: Distribución de Compromisos Financieros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Distribución de Salidas de Dinero
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          {pieData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">
              No hay datos de gastos o deudas para graficar aún.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Monto']} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
