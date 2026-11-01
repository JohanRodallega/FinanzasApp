'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { subscribeToasts, type ToastMessage } from '@/lib/toast'

const DURATION_MS = 5000

export function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    return subscribeToasts((message) => {
      setToasts((prev) => [...prev, message])
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== message.id))
      }, DURATION_MS)
    })
  }, [])

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[calc(0.75rem+env(safe-area-inset-top))] z-[100] flex flex-col items-center gap-2 px-3"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.kind === 'error' ? 'alert' : 'status'}
          className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur ${
            t.kind === 'error'
              ? 'border-rose-500/40 bg-rose-50 text-rose-900 dark:bg-rose-950/90 dark:text-rose-100'
              : 'border-emerald-500/40 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/90 dark:text-emerald-100'
          }`}
        >
          <p className="flex-1">{t.text}</p>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Cerrar aviso"
            className="shrink-0 opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
