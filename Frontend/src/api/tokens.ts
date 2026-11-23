import type { TokenResponse } from './types'

/**
 * Persistencia minima del par de tokens. El JWT dura 15 minutos y el refresh
 * token se rota en cada `POST /auth/refresh`, asi que ambos se guardan juntos.
 * `expiresAt` se calcula con `expiresIn` para poder renovar antes de que venza.
 */
export const TOKEN_STORAGE_KEY = 'catchthemall.tokens'

/** Margen para renovar antes de que el JWT llegue vencido al servidor. */
export const TOKEN_EXPIRY_SKEW_MS = 30_000

export interface StoredTokens {
  token: string
  refreshToken: string
  /** Milisegundos desde epoch; `null` si el JWT no trae `exp`. */
  expiresAt: number | null
}

let cached: StoredTokens | null | undefined

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const payload = token.split('.')[1]
  if (!payload) return null

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const parsed: unknown = JSON.parse(atob(padded))
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}

function expiresAtFromJwt(token: string): number | null {
  const exp = decodeJwtPayload(token)?.exp
  return typeof exp === 'number' && Number.isFinite(exp) ? exp * 1000 : null
}

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
      const token = (parsed as StoredTokens).token
      const storedExpiry = (parsed as Partial<StoredTokens>).expiresAt
      return {
        token,
        refreshToken: (parsed as StoredTokens).refreshToken,
        // Compatibilidad con tokens guardados antes de existir `expiresAt`.
        expiresAt:
          typeof storedExpiry === 'number' && Number.isFinite(storedExpiry)
            ? storedExpiry
            : expiresAtFromJwt(token),
      }
    }
    return null
  } catch {
    return null
  }
}

function readStorage(): StoredTokens | null {
  return safeParse(window.localStorage.getItem(TOKEN_STORAGE_KEY))
}

const tokenListeners = new Set<(tokens: StoredTokens | null) => void>()

function notifyTokenListeners(): void {
  const current = cached ?? null
  for (const listener of tokenListeners) listener(current)
}

/** Se dispara en las demas pestanas cuando cambia el par de tokens. */
export function onTokensChanged(listener: (tokens: StoredTokens | null) => void): () => void {
  tokenListeners.add(listener)
  return () => {
    tokenListeners.delete(listener)
  }
}

// Otra pestana inicio sesion, refresco el token o cerro sesion. La cache local
// tiene que dejar de ser la fuente de verdad en cuanto llega el evento.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== TOKEN_STORAGE_KEY && event.key !== null) return
    cached = readStorage()
    notifyTokenListeners()
  })
}

export function getTokens(): StoredTokens | null {
  if (cached === undefined) cached = readStorage()
  return cached
}

/** Fuerza una relectura para coordinar refrescos entre pestanas. */
export function reloadTokensFromStorage(): StoredTokens | null {
  cached = readStorage()
  return cached
}

export function getAccessToken(): string | null {
  return getTokens()?.token ?? null
}

export function getRefreshToken(): string | null {
  return getTokens()?.refreshToken ?? null
}

/** `sub` del JWT, util para detectar un cambio de cuenta entre pestanas. */
export function getAccessTokenSubject(): string | null {
  const token = getAccessToken()
  if (!token) return null
  const sub = decodeJwtPayload(token)?.sub
  return typeof sub === 'string' ? sub : null
}

export function isAccessTokenExpiring(skewMs = TOKEN_EXPIRY_SKEW_MS): boolean {
  const tokens = getTokens()
  if (!tokens) return false
  if (tokens.expiresAt === null) return true
  return tokens.expiresAt - Date.now() <= skewMs
}

export function saveTokens(tokens: TokenResponse): void {
  const expiresAt =
    Number.isFinite(tokens.expiresIn) && tokens.expiresIn > 0
      ? Date.now() + tokens.expiresIn * 1000
      : expiresAtFromJwt(tokens.token)

  cached = { token: tokens.token, refreshToken: tokens.refreshToken, expiresAt }
  window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(cached))
}

export function clearTokens(): void {
  cached = null
  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
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
