import { useCallback, useMemo, useState } from 'react'

interface PaginationState {
  key: unknown
  page: number
}

/**
 * Paginacion en cliente para listas que el backend devuelve completas. Reduce
 * el DOM renderizado; no cambia el volumen de la respuesta HTTP.
 */
export function usePagination<T>(items: T[], pageSize: number, resetKey?: unknown) {
  const [state, setState] = useState<PaginationState>({ key: resetKey, page: 1 })
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const requestedPage = state.key === resetKey ? state.page : 1
  const page = Math.min(Math.max(1, requestedPage), pageCount)

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  const setPage = useCallback(
    (nextPage: number) => {
      setState({ key: resetKey, page: nextPage })
    },
    [resetKey],
  )

  return {
    page,
    pageCount,
    pageItems,
    setPage,
    total: items.length,
  }
}
