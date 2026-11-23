import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useAsync } from './useAsync'

describe('useAsync', () => {
  it('conserva los datos anteriores cuando una recarga falla', async () => {
    const loader = vi
      .fn<(signal: AbortSignal) => Promise<string[]>>()
      .mockResolvedValueOnce(['pikachu'])
      .mockRejectedValueOnce(new Error('sin red'))

    const { result } = renderHook(() => useAsync(loader, []))

    await waitFor(() => expect(result.current.data).toEqual(['pikachu']))

    act(() => result.current.reload())

    await waitFor(() => expect(result.current.error).not.toBeNull())
    expect(result.current.data).toEqual(['pikachu'])
    expect(result.current.loading).toBe(false)
  })

  it('aborta la peticion al desmontar', () => {
    let signal: AbortSignal | undefined
    const loader = vi.fn((nextSignal: AbortSignal) => {
      signal = nextSignal
      return new Promise<string[]>(() => undefined)
    })

    const { unmount } = renderHook(() => useAsync(loader, []))
    unmount()

    expect(signal?.aborted).toBe(true)
  })
})
