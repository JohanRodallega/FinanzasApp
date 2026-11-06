// Pantalla de carga: el fajo de billetes del logo "respira" sobre un halo verde.
export function LoadingScreen() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background"
      role="status"
      aria-live="polite"
    >
      <div className="loader-in flex flex-col items-center gap-8">
        <div className="relative flex h-28 w-28 items-center justify-center">
          <div
            aria-hidden="true"
            className="loader-glow absolute inset-0 rounded-full bg-green-500/30 blur-2xl"
          />
          <svg viewBox="0 0 64 64" className="relative h-24 w-24" aria-hidden="true">
            <g className="loader-bill loader-bill-1">
              <rect x="18" y="8" width="38" height="24" rx="4" fill="#166534" />
            </g>
            <g className="loader-bill loader-bill-2">
              <rect x="13" y="15" width="40" height="26" rx="4" fill="#15803d" />
            </g>
            <g className="loader-bill loader-bill-3">
              <rect x="8" y="22" width="48" height="30" rx="5" fill="#16a34a" />
              <circle className="loader-coin" cx="32" cy="37" r="6" fill="#dcfce7" />
              <circle cx="15" cy="37" r="2" fill="#dcfce7" />
              <circle cx="49" cy="37" r="2" fill="#dcfce7" />
            </g>
          </svg>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="h-1 w-40 overflow-hidden rounded-full bg-muted">
            <div className="loader-bar h-full w-2/5 rounded-full bg-gradient-to-r from-green-600 to-green-400" />
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Cargando</p>
        </div>
      </div>
    </div>
  )
}
