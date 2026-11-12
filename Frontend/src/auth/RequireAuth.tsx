import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { LoadingBlock } from '../components/ui/Feedback'

/**
 * Envuelve las rutas que necesitan `GET /users/me`. Mientras se resuelve el
 * perfil guardado se muestra la pantalla de carga, nunca un redirect prematuro.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <LoadingBlock label="Restaurando sesión" />

  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  }

  return <>{children}</>
}

/** Solo para visitantes: si ya hay sesión, el login no tiene sentido. */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  if (status === 'authenticated') return <Navigate to="/pokedex" replace />
  return <>{children}</>
}
