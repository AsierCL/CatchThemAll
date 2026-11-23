import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePagination } from './usePagination'

describe('usePagination', () => {
  it('pagina y vuelve a la primera pagina cuando cambia el filtro', () => {
    const { result, rerender } = renderHook(
      ({ items, resetKey }) => usePagination(items, 2, resetKey),
      { initialProps: { items: [1, 2, 3, 4, 5], resetKey: 'todos' } },
    )

    expect(result.current.page).toBe(1)
    expect(result.current.pageCount).toBe(3)
    expect(result.current.pageItems).toEqual([1, 2])

    act(() => result.current.setPage(3))
    expect(result.current.page).toBe(3)
    expect(result.current.pageItems).toEqual([5])

    rerender({ items: [1, 2, 3, 4, 5], resetKey: 'filtrado' })
    expect(result.current.page).toBe(1)
    expect(result.current.pageItems).toEqual([1, 2])
  })

  it('ajusta la pagina si la lista se acorta', () => {
    const { result, rerender } = renderHook(({ items }) => usePagination(items, 2), {
      initialProps: { items: [1, 2, 3, 4, 5] },
    })

    act(() => result.current.setPage(3))
    rerender({ items: [1, 2, 3] })

    expect(result.current.page).toBe(2)
    expect(result.current.pageItems).toEqual([3])
  })
})
