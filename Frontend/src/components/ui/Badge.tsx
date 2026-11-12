import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

export type BadgeTone = 'neutral' | 'brand' | 'sky' | 'amber' | 'rose' | 'violet'

const TONES: Record<BadgeTone, string> = {
  neutral: 'border-paper-400 bg-paper-100 text-ink-700',
  brand: 'border-poke-700/50 bg-poke-100 text-poke-700',
  sky: 'border-sky-400/60 bg-sky-400/10 text-sky-400',
  amber: 'border-amber-400/60 bg-amber-400/10 text-amber-400',
  rose: 'border-rose-400/60 bg-rose-400/10 text-rose-400',
  violet: 'border-violet-400/60 bg-violet-400/10 text-violet-400',
}

interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  /** Clases extra de color, por ejemplo las de `CATEGORY_META`. */
  className?: string
  dot?: boolean
  title?: string
}

export function Badge({ children, tone = 'neutral', className, dot = false, title }: BadgeProps) {
  return (
    <span
      title={title}
      className={cx(
        'inline-flex items-center gap-1.5 border px-2 py-0.5 font-pixel text-[0.625rem] uppercase tracking-[0.06em]',
        TONES[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 bg-current" aria-hidden="true" />}
      {children}
    </span>
  )
}
