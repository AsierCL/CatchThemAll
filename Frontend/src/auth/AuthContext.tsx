import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { toAppError } from '../api/errors'
import { authApi, usersApi } from '../api/endpoints'
import { onSessionExpired } from '../api/tokens'
import {
  clearTokens,
  getAccessToken,
  getAccessTokenSubject,
  getRefreshToken,
  onTokensChanged,
  saveTokens,
} from '../api/tokens'
import type { UserLoginRequest, UserRegisterRequest, UserResponseFull } from '../api/types'

type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

interface AuthContextValue {
  status: AuthStatus
  user: UserResponseFull | null
  login: (credentials: UserLoginRequest) => Promise<UserResponseFull>
  register: (payload: UserRegisterRequest) => Promise<UserResponseFull>
  logout: () => void
  /** Recarga el perfil desde `GET /users/me` (por ejemplo despues de capturar). */
  refreshUser: () => Promise<void>
  /** Aplica un perfil ya devuelto por el backend sin otra ida y vuelta. */
  setUser: (user: UserResponseFull) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(() =>
    getAccessToken() !== null || getRefreshToken() !== null ? 'loading' : 'anonymous',
  )
  const [user, setUserState] = useState<UserResponseFull | null>(null)

  const logout = useCallback(() => {
    clearTokens()
    setUserState(null)
    setStatus('anonymous')
  }, [])

  const refreshUser = useCallback(async () => {
    const current = await usersApi.me()
    setUserState(current)
    setStatus('authenticated')
  }, [])

  // El cliente axios avisa cuando el refresh token dejo de servir.
  useEffect(() => onSessionExpired(logout), [logout])

  // Sincronizacion entre pestanas: otra pestana puede iniciar sesion, refrescar
  // el JWT o cerrar sesion. El evento `storage` actualiza la cache de tokens y
  // aca se ajusta el estado de autenticacion de esta pestana.
  useEffect(() => {
    let sync = 0

    const unsubscribe = onTokensChanged((tokens) => {
      const currentSync = ++sync

      if (!tokens) {
        setUserState(null)
        setStatus('anonymous')
        return
      }

      const subject = getAccessTokenSubject()
      if (user && (!subject || subject === user.userId)) return

      setStatus('loading')
      usersApi
        .me()
        .then((profile) => {
          if (currentSync !== sync) return
          setUserState(profile)
          setStatus('authenticated')
        })
        .catch((error: unknown) => {
          if (currentSync !== sync) return
          const status = toAppError(error).status
          if (status === 401 || status === 404) clearTokens()
          setUserState(null)
          setStatus('anonymous')
        })
    })

    return () => {
      sync += 1
      unsubscribe()
    }
  }, [user])

  // Bootstrapping: si hay tokens guardados se intenta resolver el perfil. Un 401
  // lo maneja el interceptor (refresh) y, si tambien falla, se cierra la sesion.
  // Un corte de red no borra los tokens: se podra reintentar al recargar.
  useEffect(() => {
    let cancelled = false

    if (getAccessToken() === null && getRefreshToken() === null) {
      setStatus('anonymous')
      return
    }

    usersApi
      .me()
      .then((profile) => {
        if (cancelled) return
        setUserState(profile)
        setStatus('authenticated')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const status = toAppError(error).status
        if (status === 401 || status === 404) clearTokens()
        setUserState(null)
        setStatus('anonymous')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (credentials: UserLoginRequest) => {
    const tokens = await authApi.login(credentials)
    saveTokens(tokens)
    const profile = await usersApi.me()
    setUserState(profile)
    setStatus('authenticated')
    return profile
  }, [])

  const register = useCallback(async (payload: UserRegisterRequest) => {
    const tokens = await authApi.register(payload)
    saveTokens(tokens)
    const profile = await usersApi.me()
    setUserState(profile)
    setStatus('authenticated')
    return profile
  }, [])

  const setUser = useCallback((next: UserResponseFull) => {
    setUserState(next)
    setStatus('authenticated')
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, register, logout, refreshUser, setUser }),
    [status, user, login, register, logout, refreshUser, setUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return context
}
