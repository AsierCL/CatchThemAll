import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { cx } from '../../lib/cx'
import { PixelIcon, type IconName } from '../ui/PixelIcon'

interface NavItem {
  to: string
  label: string
  icon: IconName
}

const AUTH_ITEMS: NavItem[] = [
  { to: '/pokedex', label: 'Pokédex', icon: 'grid' },
  { to: '/capturar', label: 'Capturar', icon: 'camera' },
  { to: '/mi-pokedex', label: 'Mi Pokédex', icon: 'ball' },
  { to: '/ranking', label: 'Ranking', icon: 'trophy' },
  { to: '/amigos', label: 'Amigos', icon: 'users' },
]

const GUEST_ITEMS: NavItem[] = [
  { to: '/pokedex', label: 'Pokédex', icon: 'grid' },
  { to: '/capturar', label: 'Capturar', icon: 'camera' },
  { to: '/ranking', label: 'Ranking', icon: 'trophy' },
  { to: '/login', label: 'Entrar', icon: 'user' },
]

/**
 * Barra de accesos rapidos para el pulgar. Solo aparece en movil; en el resto de
 * tamanos la navegacion vive en el header. Se oculta en login y registro para
 * no tapar el formulario cuando se abre el teclado.
 */
export function MobileNav() {
  const { status } = useAuth()
  const { pathname } = useLocation()

  if (pathname === '/login' || pathname === '/registro') return null

  const authenticated = status === 'authenticated'
  const items = authenticated ? AUTH_ITEMS : GUEST_ITEMS

  return (
    <nav
      aria-label="Navegación rápida"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-paper-300 bg-paper-50/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-[2px] md:hidden"
    >
      <ul className={cx('grid h-14', authenticated ? 'grid-cols-5' : 'grid-cols-4')}>
        {items.map((item) => (
          <li key={item.to} className="min-w-0">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                cx(
                  'flex h-full flex-col items-center justify-center gap-1 px-0.5 text-center transition-colors',
                  isActive ? 'text-poke-600' : 'text-ink-500 active:bg-paper-200/70',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <PixelIcon name={item.icon} size={17} className={isActive ? 'text-poke-500' : undefined} />
                  <span className="w-full truncate font-pixel text-[0.5rem] uppercase leading-none tracking-[0.02em] min-[380px]:text-[0.5625rem]">
                    {item.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cx('mt-0.5 h-0.5 w-5', isActive ? 'bg-poke-500' : 'bg-transparent')}
                  />
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
