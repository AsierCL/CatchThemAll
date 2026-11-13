import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { famousApi } from '../../api/endpoints'
import type { FamousCategory, FamousResponse, FamousType } from '../../api/types'
import { FamousCard } from '../../components/famous/FamousCard'
import { Button } from '../../components/ui/Button'
import { EmptyState, ErrorState, LoadingGrid } from '../../components/ui/Feedback'
import { Input } from '../../components/ui/Field'
import { Panel, SectionHeading } from '../../components/ui/Panel'
import { PixelIcon } from '../../components/ui/PixelIcon'
import { useAuth } from '../../auth/AuthContext'
import { cx } from '../../lib/cx'
import { CATEGORY_META, CATEGORY_ORDER, TYPE_META, TYPE_ORDER } from '../../lib/domain'
import { useAsync } from '../../lib/useAsync'

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function FilterChip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'shrink-0 border-2 px-2.5 py-1 font-pixel text-[0.625rem] uppercase tracking-[0.05em] transition-colors max-sm:min-h-9',
        active
          ? 'border-poke-700 bg-poke-700/15 text-poke-400'
          : 'border-paper-200 bg-paper-100/60 text-ink-500 hover:border-paper-400 hover:text-ink-800',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function PokedexPage() {
  const { status } = useAuth()
  const [type, setType] = useState<FamousType | null>(null)
  const [category, setCategory] = useState<FamousCategory | null>(null)
  const [query, setQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const { data, error, loading, reload } = useAsync<FamousResponse[]>(
    () => famousApi.list({ type: type ?? undefined, category: category ?? undefined }),
    [type, category],
  )

  // El catalogo no tiene busqueda por nombre en la API: se filtra en cliente
  // sobre el listado ya filtrado por tipo y categoria.
  const visible = useMemo(() => {
    const term = normalize(query.trim())
    const list = data ?? []
    const filtered = term ? list.filter((famous) => normalize(famous.name).includes(term)) : list
    return [...filtered].sort((a, b) => a.pokedexNumber - b.pokedexNumber)
  }, [data, query])

  const activeFilters = (type ? 1 : 0) + (category ? 1 : 0) + (query.trim() ? 1 : 0)
  const activeChips = (type ? 1 : 0) + (category ? 1 : 0)

  function clearFilters() {
    setType(null)
    setCategory(null)
    setQuery('')
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Catálogo nacional"
        title="Pokédex de famosos"
        description="Todos los famosos registrados, con su rareza y cuántos cazadores ya los atraparon. Elegí uno y capturalo con una foto."
        action={
          <Link
            to={status === 'authenticated' ? '/capturar' : '/login'}
            state={{ from: '/capturar' }}
            className="block max-sm:w-full"
          >
            <Button icon={<PixelIcon name="camera" size={14} />} className="max-sm:w-full">
              Capturar
            </Button>
          </Link>
        }
      />

      <Panel tone="muted" className="space-y-4">
        <Input
          label="Buscar por nombre"
          placeholder="Ada, Messi, Frida…"
          type="search"
          autoComplete="off"
          enterKeyHint="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-paper-200 pt-3">
          <p className="font-pixel text-[0.625rem] uppercase tracking-[0.05em] text-ink-400">
            {loading ? 'Cargando…' : `${visible.length} resultado${visible.length === 1 ? '' : 's'}`}
          </p>
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Limpiar filtros ({activeFilters})
            </Button>
          )}
        </div>

        {/* En movil los filtros arrancan plegados para que el catalogo quede cerca. */}
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          aria-controls="filtros-pokedex"
          className="flex w-full items-center justify-between gap-3 border-2 border-paper-200 bg-paper-0 px-3 py-2.5 font-pixel text-[0.6875rem] uppercase tracking-[0.04em] text-ink-600 transition-colors active:bg-paper-100 sm:hidden"
        >
          <span className="flex items-center gap-2">
            <PixelIcon name="grid" size={13} />
            Rareza y tipo
            {activeChips > 0 && <span className="text-poke-500">({activeChips})</span>}
          </span>
          <span className={cx('text-[0.625rem]', filtersOpen ? 'text-poke-500' : 'text-ink-400')}>
            {filtersOpen ? 'Cerrar' : 'Abrir'}
          </span>
        </button>

        <div id="filtros-pokedex" className={cx('space-y-4', !filtersOpen && 'max-sm:hidden')}>
          <div className="space-y-2">
            <p className="label-pixel">Rareza</p>
            <div className="-mx-4 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
              <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
                <FilterChip active={category === null} onClick={() => setCategory(null)}>
                  Todas
                </FilterChip>
                {CATEGORY_ORDER.map((key) => (
                  <FilterChip
                    key={key}
                    active={category === key}
                    onClick={() => setCategory(category === key ? null : key)}
                    className={category === key ? undefined : CATEGORY_META[key].text}
                  >
                    {CATEGORY_META[key].label}
                  </FilterChip>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="label-pixel">Tipo</p>
            <div className="-mx-4 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
              <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
                <FilterChip active={type === null} onClick={() => setType(null)}>
                  Todos
                </FilterChip>
                {TYPE_ORDER.map((key) => (
                  <FilterChip
                    key={key}
                    active={type === key}
                    onClick={() => setType(type === key ? null : key)}
                    className={type === key ? undefined : TYPE_META[key].text}
                  >
                    {TYPE_META[key].label}
                  </FilterChip>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {loading && !data ? (
        <LoadingGrid count={8} />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon="search"
          title="No hay famosos con esos filtros"
          description="Probá con otra rareza, otro tipo o borrá la búsqueda."
          action={
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((famous) => (
            <FamousCard key={famous.famousId} famous={famous} />
          ))}
        </div>
      )}

      <p className="flex items-start gap-2 text-[0.6875rem] leading-relaxed text-ink-400">
        <PixelIcon name="clock" size={12} className="mt-0.5" />
        El catálogo se sirve desde una cache de hasta 24 horas: los conteos de capturas pueden ir un poco
        atrasados.
      </p>
    </div>
  )
}
