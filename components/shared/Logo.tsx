import React, { useId } from 'react'

// Fajo de billetes sólido. Usa currentColor, así sirve en tema claro y oscuro.
export const Logo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  const id = useId()
  const backMask = `${id}-back`
  const midMask = `${id}-mid`

  return (
    <svg viewBox="0 0 64 64" fill="currentColor" role="img" aria-label="Finanzas" {...props}>
      <defs>
        <mask id={backMask}>
          <rect width="64" height="64" fill="#fff" />
          <rect x="6.5" y="13.5" width="51" height="35" rx="6.5" fill="#000" />
          <rect x="3.5" y="20.5" width="57" height="35" rx="6.5" fill="#000" />
        </mask>
        <mask id={midMask}>
          <rect width="64" height="64" fill="#fff" />
          <rect x="3.5" y="20.5" width="57" height="35" rx="6.5" fill="#000" />
        </mask>
      </defs>
      <rect x="12" y="11" width="40" height="30" rx="4" mask={`url(#${backMask})`} />
      <rect x="9" y="16" width="46" height="30" rx="4" mask={`url(#${midMask})`} />
      <path
        fillRule="evenodd"
        d="M10 23h44a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V27a4 4 0 0 1 4-4zM32 30a8 8 0 1 0 .001 0zM13 36a2 2 0 1 0 .001 0zM51 36a2 2 0 1 0 .001 0z"
      />
      <circle cx="32" cy="38" r="3" />
    </svg>
  )
}
