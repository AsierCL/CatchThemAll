import axios, { type InternalAxiosRequestConfig } from 'axios'
import type { TokenResponse } from './types'
import { clearTokens, emitSessionExpired, getAccessToken, getRefreshToken, saveTokens } from './tokens'

/**
 * Base relativa: en desarrollo Vite proxya `/api` -> `http://localhost:8080`
 * (el backend no define CORS). Se puede apuntar a otra URL con VITE_API_BASE_URL.
 */
const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const http = axios.create({
  baseURL,
  timeout: 20_000,
  headers: { Accept: 'application/json' },
})

const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh']

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

/**
 * Un solo refresh en vuelo para todas las peticiones que reciben 401 a la vez.
 * El refresh token rota en cada llamada: dos refrescos concurrentes dejarian
 * uno de los dos invalido y cerrarian la sesion sin motivo.
 */
let refreshInFlight: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = getRefreshToken()
      if (!refreshToken) throw new Error('no-refresh-token')

      const { data } = await axios.post<TokenResponse>(
        `${baseURL}/auth/refresh`,
        { refreshToken },
        { timeout: 15_000, headers: { 'Content-Type': 'application/json', Accept: 'application/json' } },
      )
      saveTokens(data)
      return data.token
    })().finally(() => {
      refreshInFlight = null
    })
  }

  return refreshInFlight
}

http.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token && !NO_REFRESH_PATHS.some((path) => config.url?.includes(path))) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
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
      !NO_REFRESH_PATHS.some((path) => config.url?.includes(path))

    if (!shouldRefresh || !config) throw error

    config._retried = true
    try {
      const token = await refreshAccessToken()
      config.headers.set('Authorization', `Bearer ${token}`)
      return await http(config)
    } catch {
      clearTokens()
      emitSessionExpired()
      throw error
    }
  },
)
