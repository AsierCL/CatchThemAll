import axios, { type InternalAxiosRequestConfig } from 'axios'
import type { TokenResponse } from './types'
import {
  clearTokens,
  emitSessionExpired,
  getAccessToken,
  getRefreshToken,
  isAccessTokenExpiring,
  reloadTokensFromStorage,
  saveTokens,
} from './tokens'

/**
 * Base relativa: en desarrollo Vite proxya `/api` -> `http://localhost:8080`
 * (el backend no define CORS). Se puede apuntar a otra URL con VITE_API_BASE_URL.
 */
const baseURL = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') || '/api'

export const http = axios.create({
  baseURL,
  timeout: 20_000,
  headers: { Accept: 'application/json' },
})

const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh']
const REFRESH_LOCK = 'catchthemall.token-refresh'

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

class RefreshRejectedError extends Error {
  constructor() {
    super('Tu sesión venció. Volvé a iniciar sesión.')
    this.name = 'RefreshRejectedError'
  }
}

function isNoRefreshPath(url: string | undefined): boolean {
  return NO_REFRESH_PATHS.some((path) => url?.includes(path))
}

function isRefreshRejected(error: unknown): boolean {
  if (error instanceof RefreshRejectedError) return true
  if (!axios.isAxiosError(error)) return false
  // 401: vencio. 404: ya se uso o no existe. El resto (red, timeout, 5xx) no
  // invalida la sesion: se conserva el par y se reintenta mas tarde.
  return error.response?.status === 401 || error.response?.status === 404
}

function bearerToken(config: InternalAxiosRequestConfig): string | null {
  const header = config.headers.get('Authorization')
  if (typeof header !== 'string') return null
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length) : header
}

/**
 * Un solo refresh en vuelo para todas las peticiones que reciben 401 a la vez.
 * El refresh token rota en cada llamada: dos refrescos concurrentes dejarian
 * uno de los dos invalido y cerrarian la sesion sin motivo.
 */
let refreshInFlight: Promise<string> | null = null

async function requestNewTokens(): Promise<string> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new RefreshRejectedError()

  const { data } = await axios.post<TokenResponse>(
    `${baseURL}/auth/refresh`,
    { refreshToken },
    { timeout: 15_000, headers: { 'Content-Type': 'application/json', Accept: 'application/json' } },
  )

  // Otra pestana pudo cerrar sesion o rotar el token mientras esta peticion
  // estaba en vuelo. No se resucita una sesion cerrada ni se pisa el par nuevo.
  reloadTokensFromStorage()
  if (getRefreshToken() !== refreshToken) {
    const current = getAccessToken()
    if (current) return current
    throw new RefreshRejectedError()
  }

  saveTokens(data)
  return data.token
}

/**
 * Las pestanas comparten el mismo refresh token. Web Locks serializa el canje
 * y, al entrar, se relee localStorage: si otra pestana ya renovo, se reutiliza
 * ese token en lugar de canjear el refresh token rotado.
 */
async function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  const locks = navigator.locks
  if (locks?.request) return locks.request(REFRESH_LOCK, task)
  return task()
}

async function refreshAccessToken(rejectedToken?: string | null): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = withRefreshLock(async () => {
      reloadTokensFromStorage()
      const current = getAccessToken()
      // Si otra pestana ya renovo, el token actual es distinto del que recibio
      // el 401 y todavia sirve: no hace falta canjear el refresh token otra vez.
      if (current && !isAccessTokenExpiring() && current !== rejectedToken) return current
      return requestNewTokens()
    }).finally(() => {
      refreshInFlight = null
    })
  }

  return refreshInFlight
}

function expireSession(): void {
  clearTokens()
  emitSessionExpired()
}

http.interceptors.request.use(async (config) => {
  if (isNoRefreshPath(config.url)) return config

  // Renovacion proactiva: el JWT se cambia antes de que el servidor tenga que
  // contestar 401. Si el refresh falla por red, se conserva el token actual y
  // la peticion sigue; el interceptor de respuesta decide si hay que reintentar.
  if (getRefreshToken() && (getAccessToken() === null || isAccessTokenExpiring())) {
    try {
      await refreshAccessToken()
    } catch (error) {
      if (isRefreshRejected(error)) {
        reloadTokensFromStorage()
        // Sin Web Locks, otra pestana pudo ganar la carrera y dejar un token
        // nuevo. Solo se cierra la sesion si no quedo ninguno utilizable.
        if (getAccessToken() === null || isAccessTokenExpiring()) {
          expireSession()
          throw error
        }
      }
    }
  }

  const token = getAccessToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) throw error

    const config = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const shouldRefresh =
      status === 401 &&
      config !== undefined &&
      config._retried !== true &&
      getRefreshToken() !== null &&
      !isNoRefreshPath(config.url)

    if (!shouldRefresh || !config) throw error

    const requestToken = bearerToken(config)
    const currentToken = getAccessToken()

    // Otra peticion (de esta pestana o de otra) ya renovo mientras esta estaba
    // en vuelo. Reintentar con el token nuevo evita un segundo refresh.
    if (currentToken && currentToken !== requestToken && !isAccessTokenExpiring()) {
      config._retried = true
      config.headers.set('Authorization', `Bearer ${currentToken}`)
      return await http(config)
    }

    config._retried = true
    try {
      const token = await refreshAccessToken(requestToken)
      config.headers.set('Authorization', `Bearer ${token}`)
      return await http(config)
    } catch (refreshError) {
      if (isRefreshRejected(refreshError)) {
        reloadTokensFromStorage()
        const latestToken = getAccessToken()
        // Otra pestana pudo rotar el refresh token primero. Reintentar con su
        // token evita cerrar una sesion que sigue siendo valida.
        if (latestToken && latestToken !== requestToken && !isAccessTokenExpiring()) {
          config.headers.set('Authorization', `Bearer ${latestToken}`)
          return await http(config)
        }
        expireSession()
        throw error
      }
      // Timeout o corte de red: la sesion sigue viva y el error visible es el
      // de conexion, no un logout.
      throw refreshError
    }
  },
)
