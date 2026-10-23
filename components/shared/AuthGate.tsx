'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      if (data.session) {
        setReady(true)
      } else {
        router.replace('/login')
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setReady(false)
        router.replace('/login')
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [router])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Cargando...
      </div>
    )
  }

  return <>{children}</>
}
