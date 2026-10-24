/** Formato de pesos colombianos sin decimales: $1.250.000 o -$30.000 */
export const fmt = (n: number) => {
  const value = Math.round(Number(n) || 0)
  return `${value < 0 ? '-' : ''}$${Math.abs(value).toLocaleString('es-CO')}`
}

/** Formato compacto para ejes de gráficos: 1,5 M, 500 mil */
export const fmtCompact = (n: number) =>
  new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(n) || 0)
