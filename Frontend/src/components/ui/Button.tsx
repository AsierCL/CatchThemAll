import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/cx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
  icon?: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-poke-500 text-white border-poke-700 hover:bg-poke-400 active:bg-poke-600 disabled:bg-paper-200 disabled:text-ink-400 disabled:border-paper-300',
  secondary:
    'bg-paper-0 text-ink-900 border-paper-300 hover:bg-paper-100 hover:border-paper-400 disabled:text-ink-400 disabled:bg-paper-100',
  ghost:
    'bg-transparent text-ink-700 border-transparent hover:bg-paper-100 hover:text-ink-900 disabled:text-ink-400',
  danger:
    'bg-rose-400/10 text-rose-400 border-rose-400/50 hover:bg-rose-400/20 disabled:bg-paper-100 disabled:text-ink-400 disabled:border-paper-300',
}

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[0.6875rem] gap-1.5',
  md: 'px-4 py-2.5 text-xs gap-2',
  lg: 'px-6 py-3 text-sm gap-2.5',
}

/**
 * Boton con relieve duro: al presionar se hunde 2px y pierde la sombra, como un
 * boton de consola.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex items-center justify-center border-2 font-pixel uppercase tracking-[0.04em]',
        'shadow-pixel-sm transition-[transform,background-color,color,box-shadow] duration-100',
        'enabled:hover:-translate-y-px enabled:active:translate-x-[2px] enabled:active:translate-y-[2px] enabled:active:shadow-none',
        'disabled:cursor-not-allowed disabled:shadow-none',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Dots /> : icon}
      <span>{children}</span>
    </button>
  )
}

function Dots() {
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      <span className="size-1 animate-blink bg-current" />
      <span className="size-1 animate-blink bg-current [animation-delay:160ms]" />
      <span className="size-1 animate-blink bg-current [animation-delay:320ms]" />
    </span>
  )
}
