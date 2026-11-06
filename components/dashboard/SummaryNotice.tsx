'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'

const KEY = 'finanzas_summary_notice_dismissed'

/**
 * Aviso del resumen del mes anterior. Se cierra con "Ver" u "Ok" y no vuelve a
 * salir para ese mes (se recuerda en este dispositivo).
 */
export function SummaryNotice({ monthId, monthName }: { monthId: string; monthName: string }) {
  // Oculto hasta leer localStorage, para que no parpadee
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(KEY) !== monthId)
    } catch {
      setVisible(true)
    }
  }, [monthId])

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(KEY, monthId)
    } catch {
      // Sin acceso a localStorage: solo se oculta mientras la página esté abierta
    }
  }

  if (!visible) return null

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <span className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
        <span>
          Ya está listo tu resumen de <strong>{monthName}</strong>
        </span>
      </span>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Link href="/resumen" onClick={dismiss} className={buttonVariants({ size: 'sm' })}>
          Ver
        </Link>
        <Button type="button" size="sm" variant="outline" onClick={dismiss}>
          Ok
        </Button>
      </div>
    </div>
  )
}
