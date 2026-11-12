import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { cx } from '../../lib/cx'
import { formatNumber } from '../../lib/format'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { PixelIcon } from '../ui/PixelIcon'

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
  const location = useLocation()
  const navigate = useNavigate()

  // Cerrar el panel movil al navegar.
  useEffect(() => setMenuOpen(false), [location.pathname])

  return (
    <header className="sticky top-0 z-40 border-b-2 border-paper-300 bg-paper-50/92 backdrop-blur-[2px]">
      <div className="h-[3px] bg-poke-500" aria-hidden="true" />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
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

        <div className="flex items-center gap-3">
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
                className="hidden items-center gap-2 border-2 border-transparent px-1 py-1 transition-colors hover:border-paper-300 sm:flex"
                title="Mi perfil"
              >
                <Avatar name={user.name} photoUrl={user.photoUrl} size="xs" />
                <span className="max-w-24 truncate font-pixel text-[0.625rem] uppercase text-ink-700">{user.name}</span>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                className="hidden md:inline-flex"
              >
                Salir
              </Button>
            </>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link to="/registro">
                <Button size="sm">Crear cuenta</Button>
              </Link>
            </div>
          )}

          <button
            type="button"
            className="border-2 border-paper-300 p-2 text-ink-700 transition-colors hover:border-paper-400 hover:text-ink-900 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="menu-movil"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <PixelIcon name={menuOpen ? 'close' : 'menu'} size={16} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div id="menu-movil" className="border-t-2 border-paper-300 bg-paper-100 md:hidden">
          <nav aria-label="Navegación principal móvil" className="mx-auto grid max-w-6xl gap-1 p-4">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cx(
                    'border-2 px-3 py-2 font-pixel text-[0.6875rem] uppercase tracking-[0.05em]',
                    isActive
                      ? 'border-poke-700 bg-poke-100 text-poke-700'
                      : 'border-paper-200 text-ink-600 hover:border-paper-400 hover:text-ink-900',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}

            <div className="mt-2 grid gap-1 border-t-2 border-paper-200 pt-3">
              {status === 'authenticated' && user ? (
                <>
                  <Link to="/perfil" className="border-2 border-paper-200 px-3 py-2 font-pixel text-[0.6875rem] uppercase text-ink-700">
                    Mi perfil · {formatNumber(user.score)} pts
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
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="secondary" size="sm" fullWidth>
                      Entrar
                    </Button>
                  </Link>
                  <Link to="/registro">
                    <Button size="sm" fullWidth>
                      Crear cuenta
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
