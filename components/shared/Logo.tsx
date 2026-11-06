import React from 'react'

// Fajo de billetes verde. Colores fijos, sin máscaras ni filtros: se ve nítido a cualquier tamaño.
export const Logo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label="Finanzapp" {...props}>
      <rect x="18" y="8" width="38" height="24" rx="4" fill="#166534" />
      <rect x="13" y="15" width="40" height="26" rx="4" fill="#15803d" />
      <rect x="8" y="22" width="48" height="30" rx="5" fill="#16a34a" />
      <rect x="41" y="8" width="4" height="44" fill="#14532d" />
      <circle cx="32" cy="37" r="6" fill="#dcfce7" />
      <circle cx="15" cy="37" r="2" fill="#dcfce7" />
      <circle cx="49" cy="37" r="2" fill="#dcfce7" />
    </svg>
  )
}
