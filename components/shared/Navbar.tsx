'use client'

import React from 'react'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { HouseholdDialog } from '@/components/shared/HouseholdDialog'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Household } from '@/types/finance'
import { User, Users, LogOut } from 'lucide-react'

interface NavbarProps {
  userName: string
  scope: string
  households: Household[]
  onScopeChange: (scope: string) => void
  onHouseholdsChanged: (newHouseholdId?: string) => void
}

export const Navbar: React.FC<NavbarProps> = ({
  userName,
  scope,
  households,
  onScopeChange,
  onHouseholdsChanged,
}) => {
  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 min-h-16 py-2 flex flex-wrap items-center justify-between gap-2">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
            FinanzasApp
          </span>
        </div>

        {/* Pestañas: Personal + un hogar por pestaña */}
        <nav className="order-last w-full md:order-none md:w-auto flex items-center gap-2 overflow-x-auto">
          <Button
            variant={scope === 'personal' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onScopeChange('personal')}
            className="flex items-center gap-2 hover:bg-accent transition-colors"
          >
            <User className="h-4 w-4" />
            <span>Personal</span>
          </Button>

          {households.map((h) => (
            <Button
              key={h.id}
              variant={scope === h.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onScopeChange(h.id)}
              className="flex items-center gap-2 hover:bg-accent transition-colors"
            >
              <Users className="h-4 w-4" />
              <span>{h.name}</span>
            </Button>
          ))}
        </nav>

        {/* Usuario, hogares, tema y salir */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-sm text-muted-foreground">
            Bienvenido, <span className="font-semibold text-foreground">{userName}</span>
          </span>
          <HouseholdDialog households={households} onChanged={onHouseholdsChanged} />
          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Cerrar sesión"
            onClick={() => supabase.auth.signOut()}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
