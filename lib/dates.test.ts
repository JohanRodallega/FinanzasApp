import { describe, expect, it } from 'vitest'
import { monthIndexOf, monthKey } from '@/lib/dates'

describe('monthIndexOf', () => {
  it('lee las fechas YYYY-MM-DD sin correrlas por zona horaria', () => {
    expect(monthIndexOf('2026-10-01')).toBe(2026 * 12 + 9)
    expect(monthIndexOf('2026-01-31')).toBe(2026 * 12)
  })

  it('acepta objetos Date', () => {
    expect(monthIndexOf(new Date(2026, 10, 15))).toBe(2026 * 12 + 10)
  })
})

describe('monthKey', () => {
  it('es el inverso de monthIndexOf', () => {
    expect(monthKey(monthIndexOf('2026-10-15'))).toBe('2026-10-01')
    expect(monthKey(monthIndexOf('2027-01-02'))).toBe('2027-01-01')
  })

  it('maneja el cambio de año', () => {
    expect(monthKey(2026 * 12 + 12)).toBe('2027-01-01')
    expect(monthKey(2026 * 12 - 1)).toBe('2025-12-01')
  })
})
