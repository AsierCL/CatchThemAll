import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { buttonStyles, type ButtonSize, type ButtonVariant } from './buttonStyles'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  icon?: ReactNode
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
      className={buttonStyles({ variant, size, fullWidth, className })}
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
