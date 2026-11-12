import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi, usersApi } from '../api/endpoints'
import { onSessionExpired } from '../api/tokens'
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from '../api/tokens'
import type { UserLoginRequest, UserRegisterRequest, UserResponse } from '../api/types'

type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

interface AuthContextValue {
  status: AuthStatus
  user: UserResponse | null
  login: (credentials: UserLoginRequest) => Promise<UserResponse>
  register: (payload: UserRegisterRequest) => Promise<UserResponse>
  logout: () => void
  /** Recarga el perfil desde `GET /users/me` (por ejemplo despues de capturar). */
  refreshUser: () => Promise<void>
  /** Aplica un perfil ya devuelto por el backend sin otra ida y vuelta. */
  setUser: (user: UserResponse) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(() =>
    getAccessToken() !== null || getRefreshToken() !== null ? 'loading' : 'anonymous',
  )
  const [user, setUserState] = useState<UserResponse | null>(null)

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

  // Bootstrapping: si hay tokens guardados se intenta resolver el perfil. Un 401
  // lo maneja el interceptor (refresh) y, si tambien falla, se cierra la sesion.
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
      .catch(() => {
        if (cancelled) return
        clearTokens()
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

  const setUser = useCallback((next: UserResponse) => {
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
