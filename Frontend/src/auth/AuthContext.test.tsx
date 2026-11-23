import { act, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usersApi } from '../api/endpoints'
import { clearTokens, saveTokens, TOKEN_STORAGE_KEY } from '../api/tokens'
import { fakeTokenResponse } from '../test/fakeTokens'
import { AuthProvider, useAuth } from './AuthContext'

vi.mock('../api/endpoints', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
  },
  usersApi: {
    me: vi.fn(),
  },
}))

const profile = {
  userId: 'user-1',
  name: 'Ada',
  photoUrl: null,
  score: 10,
  captureCount: 2,
  friendIds: [],
  description: '',
}

function Probe() {
  const { status, user } = useAuth()
  return <p data-testid="auth-state">{`${status}:${user?.name ?? ''}`}</p>
}

describe('AuthProvider', () => {
  beforeEach(() => {
    clearTokens()
    window.localStorage.clear()
    vi.mocked(usersApi.me).mockReset()
    vi.mocked(usersApi.me).mockResolvedValue(profile)
  })

  it('inicia sesion cuando otra pestana guarda tokens', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('anonymous:'))

    act(() => {
      const tokens = fakeTokenResponse()
      window.localStorage.setItem(
        TOKEN_STORAGE_KEY,
        JSON.stringify({ token: tokens.token, refreshToken: tokens.refreshToken, expiresAt: Date.now() + 900_000 }),
      )
      window.dispatchEvent(new StorageEvent('storage', { key: TOKEN_STORAGE_KEY }))
    })

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated:Ada'))
  })

  it('cierra sesion cuando otra pestana borra los tokens', async () => {
    saveTokens(fakeTokenResponse())

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated:Ada'))

    act(() => {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY)
      window.dispatchEvent(new StorageEvent('storage', { key: TOKEN_STORAGE_KEY }))
    })

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('anonymous:'))
  })
})
