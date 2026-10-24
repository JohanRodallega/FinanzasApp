/**
 * Los meses se manejan como un número entero: año * 12 + mes (0-11).
 * Así se pueden sumar y restar meses sin problemas de zona horaria.
 */
export const monthIndexOf = (value: string | Date): number => {
  if (value instanceof Date) return value.getFullYear() * 12 + value.getMonth()
  // Las fechas "YYYY-MM-DD" se leen a mano para que la zona horaria no las corra de día
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m] = value.split('-').map(Number)
    return y * 12 + (m - 1)
  }
  const d = new Date(value)
  return d.getFullYear() * 12 + d.getMonth()
}

export const currentMonthIndex = () => monthIndexOf(new Date())

/** Primer día del mes en formato de base de datos: 2026-10-01 */
export const monthKey = (index: number) => {
  const y = Math.floor(index / 12)
  const m = index % 12
  return `${y}-${String(m + 1).padStart(2, '0')}-01`
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Octubre de 2026 */
export const monthLabel = (index: number) =>
  capitalize(
    new Date(Math.floor(index / 12), index % 12, 1).toLocaleDateString('es-CO', {
      month: 'long',
      year: 'numeric',
    })
  )

/** septiembre */
export const monthLongName = (index: number) =>
  new Date(Math.floor(index / 12), index % 12, 1).toLocaleDateString('es-CO', { month: 'long' })

/** oct */
export const monthShort = (index: number) =>
  new Date(Math.floor(index / 12), index % 12, 1)
    .toLocaleDateString('es-CO', { month: 'short' })
    .replace('.', '')

/** Fecha de hoy (hora local) como YYYY-MM-DD */
export const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 5 oct 2026 */
export const formatDate = (value: string) => {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
