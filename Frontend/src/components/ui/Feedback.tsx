import type { ReactNode } from 'react'
import type { AppError } from '../../api/errors'
import { cx } from '../../lib/cx'
import { Button } from './Button'
import { Panel } from './Panel'
import { PixelIcon, type IconName } from './PixelIcon'

export function Spinner({ label = 'Cargando' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-ink-500" role="status">
      <span className="flex items-end gap-0.5" aria-hidden="true">
        <span className="h-2 w-1.5 animate-blink bg-poke-500" />
        <span className="h-3 w-1.5 animate-blink bg-poke-500 [animation-delay:120ms]" />
        <span className="h-4 w-1.5 animate-blink bg-poke-500 [animation-delay:240ms]" />
      </span>
      <span className="font-pixel text-[0.625rem] uppercase tracking-[0.08em]">{label}</span>
    </span>
  )
}

/** Esqueletos con la forma de las tarjetas para que el salto no sea brusco. */
export function LoadingGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="border-2 border-paper-200 bg-paper-100/60 p-4">
          <div className="mb-3 h-2 w-10 bg-paper-200" />
          <div className="mb-2 h-4 w-3/4 bg-paper-200" />
          <div className="mb-4 h-3 w-1/2 bg-paper-200/70" />
          <div className="h-3 w-full bg-paper-200/50" />
        </div>
      ))}
    </div>
  )
}

export function LoadingBlock({ label = 'Cargando' }: { label?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center">
      <Spinner label={label} />
    </div>
  )
}

interface ErrorStateProps {
  error: AppError
  onRetry?: () => void
  className?: string
}

export function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  return (
    <Panel tone="muted" className={cx('border-rose-400/40 text-center', className)}>
      <div className="mx-auto flex max-w-md flex-col items-center gap-3">
        <span className="border-2 border-rose-400/50 bg-rose-400/10 p-2 text-rose-400">
          <PixelIcon name="warning" size={20} />
        </span>
        <h3 className="font-pixel text-sm text-ink-900">{error.title}</h3>
        <p className="text-sm leading-relaxed text-ink-500">{error.message}</p>
        {error.details.length > 0 && (
          <ul className="w-full space-y-1 border-2 border-paper-200 bg-paper-50/40 p-2 text-left text-[0.6875rem] text-ink-400">
            {error.details.map((detail) => (
              <li key={detail} className="truncate" title={detail}>
                · {detail}
              </li>
            ))}
          </ul>
        )}
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Reintentar
          </Button>
        )}
      </div>
    </Panel>
  )
}

interface EmptyStateProps {
  icon?: IconName
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon = 'search', title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cx('flex flex-col items-center gap-3 border-2 border-dashed border-paper-300 px-6 py-12 text-center', className)}>
      <span className="text-ink-400">
        <PixelIcon name={icon} size={28} />
      </span>
      <h3 className="font-pixel text-sm text-ink-900">{title}</h3>
      {description && <p className="max-w-sm text-sm leading-relaxed text-ink-500">{description}</p>}
      {action}
    </div>
  )
}
