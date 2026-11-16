import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { cx } from '../../lib/cx'
import { formatNumber } from '../../lib/format'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { ButtonLink } from '../ui/ButtonLink'
import { PixelIcon } from '../ui/PixelIcon'

const CAN_USE_POPOVER = typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype

const NAV_ITEMS = [
  { to: '/pokedex', label: 'Pokédex' },
  { to: '/capturar', label: 'Capturar' },
  { to: '/mi-pokedex', label: 'Mi Pokédex' },
  { to: '/ranking', label: 'Ranking' },
  { to: '/amigos', label: 'Amigos' },
]

function Wordmark() {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="CatchThemAll, ir al inicio">
      <span className="border-2 border-poke-700 bg-poke-100 p-1.5 text-poke-600 transition-colors group-hover:bg-poke-700/25">
        <PixelIcon name="ball" size={18} accentColor="var(--color-ink-900)" />
      </span>
      <span className="font-pixel text-[0.8125rem] leading-tight tracking-[0.08em] text-ink-900">
        CATCH
        <span className="text-poke-500">THEM</span>
        ALL
      </span>
    </Link>
  )
}

export function Navbar() {
  const { status, user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()

  // El popover nativo avisa cuando se abre o se cierra (light dismiss, Escape,
  // click en un enlace). Mantenemos `aria-expanded` y el icono sincronizados.
  useEffect(() => {
    const menu = menuRef.current
    if (!menu) return
    const handleToggle = (event: Event) => {
      const state = (event as Event & { newState?: string }).newState
      setMenuOpen(state === 'open')
    }
    menu.addEventListener('toggle', handleToggle)
    return () => menu.removeEventListener('toggle', handleToggle)
  }, [])

  // Cerrar el panel movil al navegar.
  useEffect(() => {
    const menu = menuRef.current
    if (menu) {
      try {
        if (menu.matches(':popover-open')) menu.hidePopover()
      } catch {
        // Popover no soportado: el fallback usa el estado.
      }
    }
    if (!CAN_USE_POPOVER) setMenuOpen(false)
  }, [location.pathname])

  // Fallback para navegadores sin Popover API.
  useEffect(() => {
    if (CAN_USE_POPOVER || !menuOpen) return
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-40 border-b-2 border-paper-300 bg-paper-50/92 pt-[env(safe-area-inset-top,0px)] backdrop-blur-[2px]">
      <div className="h-[3px] bg-poke-500" aria-hidden="true" />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:gap-4">
        <div className="flex min-w-0 items-center gap-6">
          <Wordmark />
          <nav aria-label="Navegación principal" className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cx(
                    'border-b-2 px-2 py-1 font-pixel text-[0.6875rem] uppercase tracking-[0.06em] transition-colors',
                    isActive
                      ? 'border-poke-500 text-poke-600'
                      : 'border-transparent text-ink-500 hover:border-paper-400 hover:text-ink-900',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {status === 'authenticated' && user ? (
            <>
              <span
                className="hidden items-center gap-1.5 border-2 border-paper-300 bg-paper-100 px-2 py-1 font-pixel text-[0.625rem] text-amber-400 sm:flex"
                title="Puntaje acumulado"
              >
                <PixelIcon name="spark" size={12} />
                {formatNumber(user.score)}
                <span className="text-ink-400">pts</span>
              </span>

              <Link
                to="/perfil"
                className="flex size-11 items-center justify-center border-2 border-transparent transition-colors hover:border-paper-300 sm:size-auto sm:justify-start sm:gap-2 sm:px-1 sm:py-1"
                title="Mi perfil"
              >
                <Avatar name={user.name} photoUrl={user.photoUrl} size="xs" loading="eager" />
                <span className="hidden max-w-24 truncate font-pixel text-[0.625rem] uppercase text-ink-700 sm:inline">
                  {user.name}
                </span>
              </Link>

              <div className="hidden md:block">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                >
                  Salir
                </Button>
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <ButtonLink to="/login" variant="ghost" size="sm">
                Entrar
              </ButtonLink>
              <ButtonLink to="/registro" size="sm">
                Crear cuenta
              </ButtonLink>
            </div>
          )}

          <button
            type="button"
            className="flex size-11 items-center justify-center border-2 border-paper-300 text-ink-700 transition-colors hover:border-paper-400 hover:text-ink-900 md:hidden"
            popoverTarget={CAN_USE_POPOVER ? 'menu-movil' : undefined}
            popoverTargetAction={CAN_USE_POPOVER ? 'toggle' : undefined}
            aria-expanded={menuOpen}
            aria-controls="menu-movil"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => {
              if (!CAN_USE_POPOVER) setMenuOpen((open) => !open)
            }}
          >
            <PixelIcon name={menuOpen ? 'close' : 'menu'} size={16} />
          </button>
        </div>
      </div>

      <div
        ref={menuRef}
        id="menu-movil"
        popover={CAN_USE_POPOVER ? 'auto' : undefined}
        hidden={!CAN_USE_POPOVER && !menuOpen ? true : undefined}
        className="site-menu-popover md:hidden"
      >
        <div className="mx-auto max-w-6xl p-4">
            {status === 'authenticated' && user ? (
              <div className="space-y-2">
                <Link
                  to="/perfil"
                  className="flex items-center gap-3 border-2 border-paper-200 bg-paper-0 p-3 transition-colors active:bg-paper-100"
                >
                  <Avatar name={user.name} photoUrl={user.photoUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-pixel text-xs uppercase tracking-[0.04em] text-ink-900">
                      {user.name}
                    </p>
                    <p className="mt-1 text-[0.6875rem] text-ink-500">
                      {formatNumber(user.score)} pts · {formatNumber(user.captureCount)} capturas
                    </p>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                >
                  Cerrar sesión
                </Button>
              </div>
            ) : (
              <div className="grid gap-2">
                <ButtonLink to="/login" variant="secondary" size="sm" fullWidth>
                  Entrar
                </ButtonLink>
                <ButtonLink to="/registro" size="sm" fullWidth>
                  Crear cuenta
                </ButtonLink>
              </div>
            )}
        </div>
      </div>
    </header>
  )
}
