import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeJwt, fakeTokenResponse } from '../test/fakeTokens'
import { http } from './client'
import { clearTokens, getRefreshToken, saveTokens } from './tokens'

const originalAdapter = http.defaults.adapter

function unauthorized(config: InternalAxiosRequestConfig): AxiosError {
  return new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
    status: 401,
    statusText: 'Unauthorized',
    headers: {},
    config,
    data: {},
  })
}

function ok(config: InternalAxiosRequestConfig, data: unknown): AxiosResponse {
  return { status: 200, statusText: 'OK', headers: {}, config, data }
}

describe('http client', () => {
  beforeEach(() => {
    clearTokens()
  })

  afterEach(() => {
    http.defaults.adapter = originalAdapter
  })

  it('renueva el JWT antes de que venza, sin esperar un 401', async () => {
    const newToken = fakeJwt({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) + 900 })
    const refresh = vi.spyOn(axios, 'post').mockResolvedValue({
      data: fakeTokenResponse({ token: newToken, refreshToken: 'refresh-2', expiresIn: 900 }),
    })
    let authorization = ''
    http.defaults.adapter = async (config) => {
      authorization = String(config.headers.get('Authorization'))
      return ok(config, { ok: true })
    }

    saveTokens(fakeTokenResponse({ expiresIn: 1 }))
    const response = await http.get('/protected')

    expect(response.data).toEqual({ ok: true })
    expect(refresh).toHaveBeenCalledWith(
      '/api/auth/refresh',
      { refreshToken: 'refresh-1' },
      expect.objectContaining({ timeout: 15_000 }),
    )
    expect(authorization).toBe(`Bearer ${newToken}`)
  })

  it('comparte un solo refresh entre peticiones concurrentes que reciben 401', async () => {
    const refresh = vi
      .spyOn(axios, 'post')
      .mockResolvedValue({ data: fakeTokenResponse({ token: fakeJwt({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) + 900 }) }) })

    let calls = 0
    http.defaults.adapter = async (config) => {
      calls += 1
      if (calls <= 2) throw unauthorized(config)
      return ok(config, { ok: true })
    }

    saveTokens(fakeTokenResponse())
    const responses = await Promise.all([http.get('/a'), http.get('/b')])

    expect(responses.map((response) => response.data)).toEqual([{ ok: true }, { ok: true }])
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('no cierra la sesion si el refresh falla por red', async () => {
    const refresh = vi.spyOn(axios, 'post').mockRejectedValue(new AxiosError('Network Error', 'ERR_NETWORK'))
    http.defaults.adapter = async (config) => {
      throw unauthorized(config)
    }

    saveTokens(fakeTokenResponse())
    await expect(http.get('/protected')).rejects.toMatchObject({ code: 'ERR_NETWORK' })

    expect(refresh).toHaveBeenCalled()
    expect(getRefreshToken()).toBe('refresh-1')
  })

  it('reintenta con el token que gano la carrera de refresh en otra pestana', async () => {
    const newToken = fakeJwt({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) + 900 })
    vi.spyOn(axios, 'post').mockImplementation(async () => {
      saveTokens(fakeTokenResponse({ token: newToken, refreshToken: 'refresh-2' }))
      throw new AxiosError('Not Found', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
        data: {},
      })
    })

    let calls = 0
    http.defaults.adapter = async (config) => {
      calls += 1
      if (calls === 1) throw unauthorized(config)
      return ok(config, { authorization: config.headers.get('Authorization') })
    }

    saveTokens(fakeTokenResponse())
    const response = await http.get('/protected')

    expect(response.data).toEqual({ authorization: `Bearer ${newToken}` })
    expect(getRefreshToken()).toBe('refresh-2')
  })

  it('no resucita la sesion si otra pestana cierra sesion durante el refresh', async () => {
    vi.spyOn(axios, 'post').mockImplementation(async () => {
      clearTokens()
      return { data: fakeTokenResponse({ refreshToken: 'refresh-nuevo' }) }
    })
    http.defaults.adapter = async (config) => {
      throw unauthorized(config)
    }

    saveTokens(fakeTokenResponse())
    await expect(http.get('/protected')).rejects.toMatchObject({ response: { status: 401 } })

    expect(getRefreshToken()).toBeNull()
  })

  it('cierra la sesion solo cuando el servidor rechaza el refresh token', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(
      new AxiosError('Not Found', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
        data: {},
      }),
    )
    http.defaults.adapter = async (config) => {
      throw unauthorized(config)
    }

    saveTokens(fakeTokenResponse())
    await expect(http.get('/protected')).rejects.toMatchObject({ response: { status: 401 } })

    expect(getRefreshToken()).toBeNull()
  })
})
