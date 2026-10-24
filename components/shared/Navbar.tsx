'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { HouseholdDialog } from '@/components/shared/HouseholdDialog'
import { NAV_LINKS } from '@/components/shared/nav-links'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Household } from '@/types/finance'
import { User, Users, LogOut, Terminal } from 'lucide-react'

interface NavbarProps {
  userName: string
  scope: string
  households: Household[]
  showScope: boolean
  onScopeChange: (scope: string) => void
  onHouseholdsChanged: (newHouseholdId?: string) => void
}

const chipBase =
  'inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-sm transition-colors'
const chipActive = 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400'
const chipIdle = 'border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground'

export const Navbar: React.FC<NavbarProps> = ({
  userName,
  scope,
  households,
  showScope,
  onScopeChange,
  onHouseholdsChanged,
}) => {
  const pathname = usePathname()
  const initial = userName.trim().charAt(0).toUpperCase() || '?'

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-2 sm:px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md border border-emerald-500/40 bg-emerald-500/10">
            <Terminal className="h-4 w-4 text-emerald-400" />
          </span>
          <span className="font-bold tracking-tight">
            finanzas<span className="text-emerald-400">_</span>
          </span>
        </div>

        {/* Secciones (en pantallas grandes; en celular van abajo) */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Secciones">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm transition-colors ${
                pathname === href
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Vistas: en celular van en una segunda fila con scroll horizontal */}
        {showScope && (
          <nav
            className="order-last -mx-3 flex w-[calc(100%+1.5rem)] items-center gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:order-none md:mx-0 md:w-auto md:px-0 md:pb-0"
            aria-label="Vistas"
          >
            <button
              type="button"
              onClick={() => onScopeChange('personal')}
              className={`${chipBase} ${scope === 'personal' ? chipActive : chipIdle}`}
            >
              <User className="h-4 w-4" />
              <span>Personal</span>
            </button>

            {households.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => onScopeChange(h.id)}
                className={`${chipBase} ${scope === h.id ? chipActive : chipIdle}`}
              >
                <Users className="h-4 w-4" />
                <span>{h.name}</span>
              </button>
            ))}
          </nav>
        )}

        {/* Usuario y acciones */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-xs font-bold text-emerald-400">
              {initial}
            </span>
            <span className="hidden text-sm text-muted-foreground xl:inline">
              Bienvenido, <span className="font-semibold text-foreground">{userName}</span>
            </span>
          </div>
          <HouseholdDialog households={households} onChanged={onHouseholdsChanged} />
          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            onClick={() => supabase.auth.signOut()}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
