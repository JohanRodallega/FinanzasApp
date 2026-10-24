'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { Household } from '@/types/finance'
import { Users, Copy, Check } from 'lucide-react'

interface HouseholdDialogProps {
  households: Household[]
  onChanged: (newHouseholdId?: string) => void
}

export const HouseholdDialog: React.FC<HouseholdDialogProps> = ({ households, onChanged }) => {
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    setLoading(true)
    setError(null)
    const { data, error } = await supabase.rpc('create_household', { hname: newName.trim() })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }
    setNewName('')
    onChanged(data as string)
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    setError(null)
    const { data, error } = await supabase.rpc('join_household', { code: code.trim() })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }
    setCode('')
    onChanged(data as string)
  }

  const handleCopy = async (household: Household) => {
    try {
      await navigator.clipboard.writeText(household.invite_code)
      setCopiedId(household.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // Si el navegador no permite copiar, el código sigue visible para copiarlo a mano
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Hogares"
            className="flex items-center gap-2 px-2.5 sm:px-3"
          />
        }
      >
        <Users className="h-4 w-4" />
        <span className="hidden sm:inline">Hogares</span>
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Hogares compartidos</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Mis hogares */}
          <div className="space-y-2">
            <Label>Mis hogares</Label>
            {households.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no perteneces a ningún hogar. Crea uno o únete con un código.
              </p>
            ) : (
              <ul className="space-y-2">
                {households.map((h) => (
                  <li
                    key={h.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border p-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{h.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Código: <span className="font-mono">{h.invite_code}</span>
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Copiar código"
                      className="h-10 w-10 shrink-0"
                      onClick={() => handleCopy(h)}
                    >
                      {copiedId === h.id ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Crear hogar */}
          <form onSubmit={handleCreate} className="space-y-2">
            <Label htmlFor="household-name">Crear un hogar</Label>
            <div className="flex gap-2">
              <Input
                id="household-name"
                placeholder="Ej: Casa, Pareja, Familia"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-10"
              />
              <Button type="submit" disabled={loading} className="h-10">
                Crear
              </Button>
            </div>
          </form>

          {/* Unirse con código */}
          <form onSubmit={handleJoin} className="space-y-2">
            <Label htmlFor="household-code">Unirme con un código</Label>
            <div className="flex gap-2">
              <Input
                id="household-code"
                placeholder="Código de invitación"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-10"
              />
              <Button type="submit" variant="outline" disabled={loading} className="h-10">
                Unirme
              </Button>
            </div>
          </form>

          {error && <p className="text-sm text-rose-500">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
