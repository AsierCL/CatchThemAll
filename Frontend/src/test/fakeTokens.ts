import type { TokenResponse } from '../api/types'

function base64Url(value: unknown): string {
  return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fakeJwt(payload: Record<string, unknown>): string {
  return `${base64Url({ alg: 'HS256', typ: 'JWT' })}.${base64Url(payload)}.signature`
}

export function fakeTokenResponse(overrides: Partial<TokenResponse> = {}): TokenResponse {
  return {
    token: fakeJwt({ sub: 'user-1', name: 'ada', exp: Math.floor(Date.now() / 1000) + 900 }),
    tokenType: 'Bearer',
    refreshToken: 'refresh-1',
    expiresIn: 900,
    ...overrides,
  }
}
