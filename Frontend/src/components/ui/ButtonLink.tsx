import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { buttonStyles, type ButtonSize, type ButtonVariant } from './buttonStyles'

interface ButtonLinkProps extends Omit<LinkProps, 'className' | 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  icon?: ReactNode
  className?: string
  children: ReactNode
}

/**
 * Navegacion con apariencia de boton. Evita el HTML invalido de un `<button>`
 * dentro de un `<a>` y conserva la semantica de enlace.
 */
export function ButtonLink({
  variant,
  size,
  fullWidth,
  icon,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={buttonStyles({ variant, size, fullWidth, className })} {...rest}>
      {icon}
      <span>{children}</span>
    </Link>
  )
}
