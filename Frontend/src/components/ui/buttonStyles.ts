import { cx } from '../../lib/cx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-poke-500 text-white border-poke-700 hover:bg-poke-400 active:bg-poke-600 disabled:bg-paper-200 disabled:text-ink-400 disabled:border-paper-300',
  secondary:
    'bg-paper-0 text-ink-900 border-paper-300 hover:bg-paper-100 hover:border-paper-400 disabled:text-ink-400 disabled:bg-paper-100',
  ghost:
    'bg-transparent text-ink-700 border-transparent hover:bg-paper-100 hover:text-ink-900 disabled:text-ink-400',
  danger:
    'bg-rose-400/10 text-rose-400 border-rose-400/50 hover:bg-rose-400/20 disabled:bg-paper-100 disabled:text-ink-400 disabled:border-paper-300',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-[0.6875rem] gap-1.5 max-md:min-h-11',
  md: 'px-4 py-2.5 text-xs gap-2 max-md:min-h-11',
  lg: 'px-6 py-3 text-sm gap-2.5 max-md:min-h-12',
}

interface ButtonStyleOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
}

/**
 * Estilos compartidos por `Button` y `ButtonLink`: un enlace de navegacion debe
 * verse igual que un boton sin anidar un `<button>` dentro de un `<a>`.
 */
export function buttonStyles({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: ButtonStyleOptions = {}): string {
  return cx(
    'inline-flex items-center justify-center border-2 font-pixel uppercase tracking-[0.04em]',
    'shadow-pixel-sm transition-[transform,background-color,color,box-shadow] duration-100',
    'select-none touch-manipulation',
    'hover:-translate-y-px active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
    'disabled:cursor-not-allowed disabled:shadow-none',
    'disabled:hover:translate-y-0 disabled:active:translate-x-0 disabled:active:translate-y-0',
    VARIANTS[variant],
    SIZES[size],
    fullWidth && 'w-full',
    className,
  )
}
