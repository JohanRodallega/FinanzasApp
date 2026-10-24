'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Navbar } from '@/components/shared/Navbar'
import { BottomNav } from '@/components/shared/BottomNav'
import { supabase } from '@/lib/supabase'
import { Household } from '@/types/finance'

interface AppUser {
  id: string
  name: string
}

interface AppContextValue {
  user: AppUser
  scope: string
  householdId: string | null
  households: Household[]
}

const AppContext = createContext<AppContextValue | null>(null)

/** Datos compartidos por todas las páginas: usuario, vista activa y hogares. */
export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de AppShell')
  return ctx
}

const SCOPE_KEY = 'finanzas_scope'

export function AppShell({
  children,
  showScope = true,
}: {
  children: ReactNode
  showScope?: boolean
}) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [scope, setScopeState] = useState<string>('personal')
  const [households, setHouseholds] = useState<Household[]>([])
  const [householdsLoaded, setHouseholdsLoaded] = useState(false)

  // Recordar la última vista elegida
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SCOPE_KEY)
      if (saved) setScopeState(saved)
    } catch {
      // Sin acceso a localStorage: se queda en Personal
    }
  }, [])

  const setScope = useCallback((next: string) => {
    setScopeState(next)
    try {
      localStorage.setItem(SCOPE_KEY, next)
    } catch {
      // Ignorar si no se puede guardar
    }
  }, [])

  // Usuario autenticado
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user
      if (!u) return
      const metaName = u.user_metadata?.name as string | undefined
      const name = metaName?.trim() || u.email?.split('@')[0] || 'Usuario'
      setUser({ id: u.id, name })
    })
  }, [])

  const fetchHouseholds = useCallback(async () => {
    const { data } = await supabase
      .from('households')
      .select('id, name, invite_code')
      .order('created_at', { ascending: true })
    if (data) setHouseholds(data as Household[])
    setHouseholdsLoaded(true)
  }, [])

  useEffect(() => {
    if (user) fetchHouseholds()
  }, [user, fetchHouseholds])

  // Si la vista guardada ya no existe, volver a Personal
  useEffect(() => {
    if (householdsLoaded && scope !== 'personal' && !households.some((h) => h.id === scope)) {
      setScope('personal')
    }
  }, [householdsLoaded, households, scope, setScope])

  const handleHouseholdsChanged = async (newHouseholdId?: string) => {
    await fetchHouseholds()
    if (newHouseholdId) setScope(newHouseholdId)
  }

  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Cargando...
      </div>
    )
  }

  const householdId = scope === 'personal' ? null : scope

  return (
    <AppContext.Provider value={{ user, scope, householdId, households }}>
      <div className="min-h-dvh bg-background text-foreground transition-colors duration-300">
        <Navbar
          userName={user.name}
          scope={scope}
          households={households}
          showScope={showScope}
          onScopeChange={setScope}
          onHouseholdsChanged={handleHouseholdsChanged}
        />
        <main className="container mx-auto space-y-4 px-3 py-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:space-y-6 sm:p-6 sm:pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-8">
          {children}
        </main>
        <BottomNav />
      </div>
    </AppContext.Provider>
  )
}
