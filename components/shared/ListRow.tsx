'use client'

import React from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ListRowProps {
  icon: React.ReactNode
  title: string
  subtitle?: string
  amount: string
  secondary?: string
  amountClassName?: string
  onDelete: () => void
}

/** Fila de lista pensada para celular: ícono, texto a la izquierda, monto a la derecha. */
export const ListRow: React.FC<ListRowProps> = ({
  icon,
  title,
  subtitle,
  amount,
  secondary,
  amountClassName,
  onDelete,
}) => (
  <li className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 p-2.5 transition-colors hover:bg-muted/40 sm:p-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background/60">
      {icon}
    </div>

    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium">{title}</p>
      {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
    </div>

    <div className="shrink-0 text-right">
      <p className={`text-sm font-semibold tabular-nums ${amountClassName ?? ''}`}>{amount}</p>
      {secondary && <p className="text-[11px] text-muted-foreground tabular-nums">{secondary}</p>}
    </div>

    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Eliminar"
      onClick={onDelete}
      className="h-10 w-10 shrink-0 text-muted-foreground hover:text-rose-500"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </li>
)
