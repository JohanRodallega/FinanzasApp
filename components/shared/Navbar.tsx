'use client'

import React from 'react'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { Button } from '@/components/ui/button'
import { User, Users, HeartHandshake } from 'lucide-react'

interface NavbarProps {
  currentView: 'me' | 'partner' | 'shared'
  onViewChange: (view: 'me' | 'partner' | 'shared') => void
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onViewChange }) => {
  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
            FinanzasApp
          </span>
        </div>

        {/* Pestañas de Perfiles */}
        <nav className="hidden md:flex items-center gap-2">
          <Button
            variant={currentView === 'me' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('me')}
            className="flex items-center gap-2 hover:bg-accent transition-colors"
          >
            <User className="h-4 w-4" />
            <span>Personal (Yo)</span>
          </Button>

          <Button
            variant={currentView === 'partner' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('partner')}
            className="flex items-center gap-2 hover:bg-accent transition-colors"
          >
            <Users className="h-4 w-4" />
            <span>Pareja</span>
          </Button>

          <Button
            variant={currentView === 'shared' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('shared')}
            className="flex items-center gap-2 hover:bg-accent transition-colors"
          >
            <HeartHandshake className="h-4 w-4" />
            <span>Compartido</span>
          </Button>
        </nav>

        {/* Conmutador de Tema */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
