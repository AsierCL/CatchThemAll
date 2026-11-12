import type { TokenResponse } from './types'

/**
 * Persistencia minima del par de tokens. El JWT dura 15 minutos y el refresh
 * token se rota en cada `POST /auth/refresh`, asi que ambos se guardan juntos.
 */
const STORAGE_KEY = 'catchthemall.tokens'

export interface StoredTokens {
  token: string
  refreshToken: string
}

let cached: StoredTokens | null | undefined

function safeParse(raw: string | null): StoredTokens | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as StoredTokens).token === 'string' &&
      typeof (parsed as StoredTokens).refreshToken === 'string'
    ) {
      return { token: (parsed as StoredTokens).token, refreshToken: (parsed as StoredTokens).refreshToken }
    }
    return null
  } catch {
    return null
  }
}

export function getTokens(): StoredTokens | null {
  if (cached === undefined) {
    cached = safeParse(window.localStorage.getItem(STORAGE_KEY))
  }
  return cached
}

export function getAccessToken(): string | null {
  return getTokens()?.token ?? null
}

export function getRefreshToken(): string | null {
  return getTokens()?.refreshToken ?? null
}

export function saveTokens(tokens: TokenResponse): void {
  cached = { token: tokens.token, refreshToken: tokens.refreshToken }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cached))
}

export function clearTokens(): void {
  cached = null
  window.localStorage.removeItem(STORAGE_KEY)
}

const sessionListeners = new Set<() => void>()

/** Avisa a la app cuando el refresh token dejo de servir y hay que volver al login. */
export function onSessionExpired(listener: () => void): () => void {
  sessionListeners.add(listener)
  return () => {
    sessionListeners.delete(listener)
  }
}

export function emitSessionExpired(): void {
  for (const listener of sessionListeners) listener()
}
