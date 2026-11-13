import { Link } from 'react-router-dom'
import { PixelIcon } from '../ui/PixelIcon'

export function Footer() {
  return (
    <footer className="mt-10 border-t-2 border-paper-300 bg-paper-100/60 sm:mt-16">
      <div className="h-[3px] bg-poke-500" aria-hidden="true" />
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:py-8">
        <div className="flex items-center gap-2.5 text-ink-500">
          <PixelIcon name="ball" size={14} accentColor="var(--color-ink-900)" />
          <span className="font-pixel text-[0.625rem] uppercase tracking-[0.08em]">
            CatchThemAll · Pokédex de famosos
          </span>
        </div>

        <nav aria-label="Enlaces secundarios" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-400">
          <Link to="/pokedex" className="transition-colors hover:text-ink-700">
            Catálogo
          </Link>
          <Link to="/ranking" className="transition-colors hover:text-ink-700">
            Ranking
          </Link>
          <a
            href="http://localhost:8080/swagger-ui.html"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-ink-700"
          >
            API (Swagger)
          </a>
        </nav>
      </div>
    </footer>
  )
}
