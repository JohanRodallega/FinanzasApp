'use client'

import React from 'react'
import { Check, Pencil } from 'lucide-react'

interface ExpenseRowProps {
  title: string
  subtitle?: string
  amount: string
  paid: boolean
  onToggle: () => void
  onEdit: () => void
}

/** Fila de gasto fijo: casilla de pagado a la izquierda y toque en el resto para editar. */
export const ExpenseRow: React.FC<ExpenseRowProps> = ({
  title,
  subtitle,
  amount,
  paid,
  onToggle,
  onEdit,
}) => (
  <li
    className={`flex items-center gap-2 rounded-lg border p-1.5 transition-colors ${
      paid ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-border/60 bg-muted/20'
    }`}
  >
    <button
      type="button"
      role="checkbox"
      aria-checked={paid}
      aria-label={paid ? `Marcar ${title} como pendiente` : `Marcar ${title} como pagado`}
      onClick={onToggle}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-md border-2 transition-colors ${
          paid ? 'border-emerald-400 bg-emerald-400/20' : 'border-muted-foreground/40'
        }`}
      >
        {paid && <Check className="h-4 w-4 text-emerald-400" />}
      </span>
    </button>

    <button
      type="button"
      onClick={onEdit}
      aria-label={`Editar ${title}`}
      className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-md pr-2 text-left"
    >
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-sm font-medium ${paid ? 'text-muted-foreground line-through' : ''}`}
        >
          {title}
        </span>
        {subtitle && <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>}
      </span>
      <span
        className={`shrink-0 text-sm font-semibold tabular-nums ${paid ? 'text-muted-foreground' : 'text-amber-400'}`}
      >
        {amount}
      </span>
      <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
    </button>
  </li>
)
