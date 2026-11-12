/**
 * Tipos derivados de `docs/openapi.json` (OpenAPI 3.1).
 * Los enums viajan siempre en minusculas; las vistas `Basic` no traen
 * `photoUrl` ni `description`, y las `Full` si.
 */

export type FamousCategory = 'legendary' | 'epic' | 'rare' | 'common'

export type FamousType = 'politic' | 'actor' | 'writer' | 'musician' | 'teacher' | 'meme'

export interface FamousResponse {
  famousId: string
  pokedexNumber: number
  name: string
  category: FamousCategory
  type: FamousType
  captureCount: number
  collectorCount: number
}

/** `UserResponse_Basic` y `UserResponse_Full`. */
export interface UserResponse {
  userId: string
  name: string
  score: number
  captureCount: number
  friendIds: string[]
  photoUrl?: string
  description?: string
}

export interface CaptureResponse {
  captureId: string
  famousId: string
  famousName: string
  /** Similitud coseno entre la foto y las muestras del famoso, de 0 a 1. */
  similarity: number
  /** `true` si el usuario ya tenia esa captura antes de esta peticion. */
  captured: boolean
  timestamp: string
}

export interface TokenResponse {
  token: string
  tokenType: string
  refreshToken: string
  /** Segundos de vigencia del token de acceso. */
  expiresIn: number
}

export interface UserRegisterRequest {
  name: string
  password: string
  email: string
  /** Fecha ISO `YYYY-MM-DD`, nunca futura. */
  birthDate: string
}

export interface UserLoginRequest {
  name: string
  password: string
}

export interface UserPutUpdateRequest {
  name: string
  description: string
  photoUrl: string
}

export type JsonPatchOperation =
  | { op: 'replace' | 'add'; path: '/name' | '/description' | '/photoUrl'; value: string }
  | { op: 'remove'; path: '/name' | '/description' | '/photoUrl' }

/** Cuerpo unico de error del backend (`ErrorDTO`). */
export interface ErrorDTO {
  timestamp?: string
  status?: number
  error?: string
  message?: string
  path?: string
  details?: string[]
}

export interface FamousFilters {
  type?: FamousType
  category?: FamousCategory
}
