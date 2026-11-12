import type { ElementType, ReactNode } from 'react'
import { cx } from '../../lib/cx'

interface PanelProps {
  children: ReactNode
  className?: string
  /** `flat` quita la sombra; `raised` la agranda para piezas destacadas. */
  elevation?: 'flat' | 'base' | 'raised'
  tone?: 'default' | 'muted' | 'accent'
  as?: ElementType
  padded?: boolean
}

const ELEVATION: Record<NonNullable<PanelProps['elevation']>, string> = {
  flat: 'border-2 border-paper-300',
  base: 'pixel-frame',
  raised: 'border-2 border-paper-400 shadow-pixel-lg',
}

const TONES: Record<NonNullable<PanelProps['tone']>, string> = {
  default: 'bg-paper-0',
  muted: 'bg-paper-100',
  accent: 'bg-paper-100',
}

export function Panel({
  children,
  className,
  elevation = 'base',
  tone = 'default',
  as: Component = 'div',
  padded = true,
}: PanelProps) {
  return (
    <Component className={cx(ELEVATION[elevation], TONES[tone], padded && 'p-4 sm:p-5', className)}>
      {children}
    </Component>
  )
}

interface SectionHeadingProps {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function SectionHeading({ eyebrow, title, description, action, className }: SectionHeadingProps) {
  return (
    <div className={cx('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="space-y-1.5">
        {eyebrow && <p className="label-pixel">{eyebrow}</p>}
        <h2 className="font-pixel text-lg text-ink-900 sm:text-xl">{title}</h2>
        {description && <p className="max-w-xl text-sm text-ink-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}
