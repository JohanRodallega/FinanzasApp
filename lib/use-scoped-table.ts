'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { scoped } from '@/lib/scope'
import { toast } from '@/lib/toast'

// Código de PostgREST cuando la tabla aún no existe (migración pendiente)
const TABLE_MISSING = 'PGRST205'

// Forma mínima de una consulta de Supabase; evita tipos genéricos demasiado profundos
interface ScopedQuery {
  eq: (column: string, value: string) => ScopedQuery
  is: (column: string, value: null) => ScopedQuery
  order: (
    column: string,
    options: { ascending: boolean }
  ) => PromiseLike<{ data: unknown[] | null; error: { message: string; code?: string } | null }>
}

/**
 * Carga las filas de una tabla según la vista activa (personal u hogar),
 * avisando en pantalla si algo falla.
 */
export function useScopedTable<T>(table: string, label: string, scope: string, userId: string, orderBy = 'created_at') {
  const [rows, setRows] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const request = useRef(0)

  const refetch = useCallback(async () => {
    const current = ++request.current
    setLoading(true)
    const query = supabase.from(table).select('*') as unknown as ScopedQuery
    const { data, error } = await scoped(query, scope, userId).order(orderBy, { ascending: false })
    if (current !== request.current) return // llegó una respuesta más nueva
    if (error) {
      if (error.code !== TABLE_MISSING) toast.error(`No se pudieron cargar ${label}: ${error.message}`)
      setRows([])
    } else {
      setRows((data ?? []) as T[])
    }
    setLoading(false)
  }, [table, label, scope, userId, orderBy])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { rows, setRows, loading, refetch }
}
