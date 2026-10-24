'use client'

import { useCallback, useEffect, useState } from 'react'

const KEY = 'finanzas_hide_savings'

/**
 * Controla si los montos de ahorro se muestran u ocultan.
 * Por defecto están ocultos; la preferencia se recuerda en este dispositivo.
 */
export function useHideSavings(): [boolean, () => void] {
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY)
      if (saved !== null) setHidden(saved === '1')
    } catch {
      // Sin acceso a localStorage: se queda oculto
    }
  }, [])

  const toggle = useCallback(() => {
    const next = !hidden
    setHidden(next)
    try {
      localStorage.setItem(KEY, next ? '1' : '0')
    } catch {
      // Ignorar si no se puede guardar
    }
  }, [hidden])

  return [hidden, toggle]
}
