import { useCallback, useEffect, useRef, useState } from 'react'
import { toAppError, type AppError } from '../api/errors'

export interface AsyncState<T> {
  data: T | null
  error: AppError | null
  loading: boolean
}

/**
 * Carga asincronica minima (sin libreria de estado): mantiene los datos
 * anteriores mientras recarga o si la recarga falla, ignora respuestas de
 * ejecuciones viejas, cancela la peticion al desmontar y expone `reload` para
 * reintentar a mano.
 */
export function useAsync<T>(loader: (signal: AbortSignal) => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, loading: true })
  const [nonce, setNonce] = useState(0)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    setState((previous) => ({ data: previous.data, error: null, loading: true }))

    loaderRef.current(controller.signal).then(
      (data) => {
        if (active) setState({ data, error: null, loading: false })
      },
      (error: unknown) => {
        // Un error de recarga no borra lo que el usuario ya estaba viendo.
        if (active) setState((previous) => ({ data: previous.data, error: toAppError(error), loading: false }))
      },
    )

    return () => {
      active = false
      controller.abort()
    }
    // Las dependencias las decide cada pantalla; `nonce` fuerza el reintento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  const reload = useCallback(() => setNonce((value) => value + 1), [])

  const setData = useCallback((next: T | null | ((current: T | null) => T | null)) => {
    setState((previous) => ({
      ...previous,
      data: typeof next === 'function' ? (next as (current: T | null) => T | null)(previous.data) : next,
    }))
  }, [])

  return { ...state, reload, setData }
}
