import { useEffect } from 'react'

const DEFAULT_TITLE = 'CatchThemAll — Pokédex de famosos'

/** Mantiene el titulo de la pestaña sincronizado con la pantalla actual. */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · CatchThemAll` : DEFAULT_TITLE
  }, [title])
}
