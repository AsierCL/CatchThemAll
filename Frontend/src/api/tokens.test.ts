import { beforeEach, describe, expect, it } from 'vitest'
import { fakeJwt, fakeTokenResponse } from '../test/fakeTokens'
import {
  clearTokens,
  getAccessTokenSubject,
  getRefreshToken,
  getTokens,
  isAccessTokenExpiring,
  reloadTokensFromStorage,
  saveTokens,
  TOKEN_STORAGE_KEY,
} from './tokens'

describe('tokens', () => {
  beforeEach(() => {
    clearTokens()
  })

  it('guarda la expiracion calculada desde expiresIn', () => {
    const before = Date.now()
    saveTokens(fakeTokenResponse({ expiresIn: 900 }))

    const tokens = getTokens()
    expect(tokens?.expiresAt).toBeGreaterThanOrEqual(before + 900_000)
    expect(isAccessTokenExpiring()).toBe(false)
  })

  it('deduce expiresAt del JWT en tokens guardados por versiones anteriores', () => {
    const exp = Math.floor(Date.now() / 1000) + 600
    window.localStorage.setItem(
      TOKEN_STORAGE_KEY,
      JSON.stringify({ token: fakeJwt({ sub: 'ada', exp }), refreshToken: 'refresh-old' }),
    )

    const tokens = reloadTokensFromStorage()
    expect(tokens?.expiresAt).toBe(exp * 1000)
    expect(getAccessTokenSubject()).toBe('ada')
  })

  it('sincroniza la cache cuando otra pestana escribe los tokens', () => {
    window.localStorage.setItem(
      TOKEN_STORAGE_KEY,
      JSON.stringify({
        token: fakeJwt({ sub: 'otra', exp: Math.floor(Date.now() / 1000) + 900 }),
        refreshToken: 'refresh-otra',
        expiresAt: Date.now() + 900_000,
      }),
    )
    window.dispatchEvent(new StorageEvent('storage', { key: TOKEN_STORAGE_KEY }))

    expect(getRefreshToken()).toBe('refresh-otra')
    expect(getAccessTokenSubject()).toBe('otra')
  })
})
