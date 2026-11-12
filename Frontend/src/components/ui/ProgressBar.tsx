import { cx } from '../../lib/cx'

type Tone = 'brand' | 'sky' | 'amber' | 'rose' | 'violet'

const FILL: Record<Tone, string> = {
  brand: 'bg-poke-500',
  sky: 'bg-sky-400',
  amber: 'bg-amber-400',
  rose: 'bg-rose-400',
  violet: 'bg-violet-400',
}

const SEGMENTS = 20

interface ProgressBarProps {
  /** Valor entre 0 y 1. */
  value: number
  tone?: Tone
  label?: string
  showValue?: boolean
  className?: string
}

/**
 * Barra segmentada tipo consola: 20 bloques, sin transiciones largas, con un
 * `steps()` para que el avance se sienta a saltos.
 */
export function ProgressBar({ value, tone = 'brand', label, showValue = false, className }: ProgressBarProps) {
  const safe = Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0
  const filled = Math.round(safe * SEGMENTS)

  return (
    <div className={cx('space-y-1', className)}>
      {(label || showValue) && (
        <div className="flex items-baseline justify-between gap-2">
          {label && <span className="label-pixel">{label}</span>}
          {showValue && <span className="font-pixel text-[0.6875rem] text-ink-700">{Math.round(safe * 100)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(safe * 100)}
        aria-label={label}
        className="flex h-3 w-full gap-px border-2 border-paper-300 bg-paper-50/70 p-px"
      >
        {Array.from({ length: SEGMENTS }, (_, index) => (
          <span
            key={index}
            className={cx('h-full flex-1 transition-opacity duration-150', index < filled ? FILL[tone] : 'bg-paper-200/40')}
          />
        ))}
      </div>
    </div>
  )
}
