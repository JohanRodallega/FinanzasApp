import React from 'react'

interface SegmentBarProps {
  percent: number
  segments?: number
  colorClass?: string
}

/** Barra de progreso por bloques, estilo terminal. */
export const SegmentBar: React.FC<SegmentBarProps> = ({ percent, segments = 24, colorClass }) => {
  const safe = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0))
  const filled = Math.round((safe / 100) * segments)
  const color =
    colorClass ?? (safe > 80 ? 'bg-rose-500' : safe > 50 ? 'bg-amber-400' : 'bg-emerald-400')

  return (
    <div
      className="flex gap-[3px]"
      role="progressbar"
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className={`h-3 flex-1 rounded-[2px] transition-colors duration-500 ${i < filled ? color : 'bg-muted'}`}
        />
      ))}
    </div>
  )
}
