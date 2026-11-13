import { Link } from 'react-router-dom'
import { usersApi } from '../../api/endpoints'
import type { UserResponse } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { EmptyState, ErrorState, LoadingGrid } from '../../components/ui/Feedback'
import { Panel } from '../../components/ui/Panel'
import { cx } from '../../lib/cx'
import { formatNumber } from '../../lib/format'
import { useAsync } from '../../lib/useAsync'

type PodiumAccent = 'legendary' | 'rare' | 'common'

/** Acentos del podio: primero legendario, segundo raro, tercero común. */
const PODIUM_STYLES: Record<PodiumAccent, { frame: string; number: string; background: string }> = {
  legendary: { frame: 'border-legendary/70', number: 'text-legendary', background: 'bg-legendary/10' },
  rare: { frame: 'border-rare/70', number: 'text-rare', background: 'bg-rare/10' },
  common: { frame: 'border-common/70', number: 'text-common', background: 'bg-common/10' },
}

const PODIUM_ORDER: PodiumAccent[] = ['legendary', 'rare', 'common']

const ROW_GRID = 'grid-cols-[2.25rem_minmax(0,1fr)_auto] sm:grid-cols-[3.5rem_minmax(0,1fr)_7rem_6rem]'

export function RankingPage() {
  const { user } = useAuth()
  const ranking = useAsync(() => usersApi.ranking(), [])

  const currentUserId = user?.userId

  if (ranking.loading) {
    return (
      <div className="space-y-6" aria-live="polite" aria-busy="true">
        <PageHeader />
        <LoadingGrid count={6} />
      </div>
    )
  }

  if (ranking.error) {
    return (
      <div className="space-y-6" aria-live="polite">
        <PageHeader />
        <ErrorState error={ranking.error} onRetry={ranking.reload} />
      </div>
    )
  }

  const entries = ranking.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader />

      {entries.length === 0 ? (
        <div aria-live="polite">
          <EmptyState
            icon="trophy"
            title="Todavía no hay cazadores"
            description="Cuando alguien capture a su primer famoso va a aparecer acá, ordenado por puntaje."
          />
        </div>
      ) : (
        <>
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4" aria-label="Podio">
            {entries.slice(0, 3).map((entry, index) => (
              <PodiumCard
                key={entry.userId}
                position={index + 1}
                accent={PODIUM_ORDER[index]}
                entry={entry}
                isCurrent={entry.userId === currentUserId}
              />
            ))}
          </ol>

          {entries.length > 3 && (
            <Panel padded={false}>
              <div
                className={cx(
                  'grid items-center gap-2 border-b-2 border-l-2 border-paper-300 border-l-transparent px-3 py-2 sm:px-4',
                  ROW_GRID,
                )}
              >
                <span className="label-pixel">#</span>
                <span className="label-pixel">Cazador</span>
                <span className="label-pixel text-right">Puntaje</span>
                <span className="label-pixel hidden text-right sm:block">Capturas</span>
              </div>
              <ol aria-label="Resto del ranking">
                {entries.slice(3).map((entry, index) => (
                  <RankingRow
                    key={entry.userId}
                    position={index + 4}
                    entry={entry}
                    isCurrent={entry.userId === currentUserId}
                  />
                ))}
              </ol>
            </Panel>
          )}
        </>
      )}

      <p className="text-xs leading-relaxed text-ink-400">
        El ranking se sirve desde una cache del servidor: puede tardar hasta 1 hora en reflejar los últimos puntos
        sumados.
      </p>
    </div>
  )
}

function PageHeader() {
  return (
    <header className="space-y-2">
      <p className="label-pixel">Competencia</p>
      <h1 className="font-pixel text-lg text-ink-900 sm:text-2xl">Ranking de cazadores</h1>
      <p className="max-w-2xl text-sm leading-relaxed text-ink-500">
        Los cazadores con más puntos, ordenados de mayor a menor.
      </p>
    </header>
  )
}

interface PodiumCardProps {
  position: number
  accent: PodiumAccent
  entry: UserResponse
  isCurrent: boolean
}

function PodiumCard({ position, accent, entry, isCurrent }: PodiumCardProps) {
  const style = PODIUM_STYLES[accent]

  return (
    <li className="h-full">
      <Link
        to={`/usuarios/${entry.userId}`}
        className={cx(
          'flex h-full items-center gap-3 border-2 bg-paper-0 p-3 text-left shadow-pixel sm:flex-col sm:gap-3 sm:p-5 sm:text-center',
          'transition-[transform,box-shadow] duration-100 hover:-translate-y-px active:translate-y-0 active:shadow-none sm:active:shadow-pixel',
          isCurrent ? 'border-poke-500' : style.frame,
        )}
      >
        <span
          className={cx(
            'shrink-0 border-2 px-2 py-1 font-pixel text-xs sm:px-2.5 sm:text-sm',
            isCurrent ? 'border-poke-500/70 bg-poke-700/15 text-poke-400' : cx(style.background, style.frame, style.number),
          )}
        >
          {position}°
        </span>

        <Avatar name={entry.name} photoUrl={entry.photoUrl} size="sm" className="sm:hidden" />
        <Avatar name={entry.name} photoUrl={entry.photoUrl} size="lg" className="hidden sm:inline-flex" />

        <div className="min-w-0 flex-1 space-y-1 sm:flex-none">
          <p className="line-clamp-2 font-pixel text-sm leading-tight text-ink-900 sm:line-clamp-none">{entry.name}</p>
          {isCurrent && <Badge tone="brand">vos</Badge>}
          <p className="font-pixel text-[0.5625rem] leading-tight text-amber-400 sm:hidden">
            {formatNumber(entry.score)} pts
          </p>
          <p className="font-pixel text-[0.5rem] uppercase leading-tight tracking-[0.03em] text-ink-400 sm:hidden">
            {formatNumber(entry.captureCount)} capturas
          </p>
        </div>

        <dl className="hidden w-full grid-cols-2 gap-2 sm:grid">
          <div className="border-2 border-paper-300 bg-paper-100/60 p-2">
            <dt className="label-pixel">Puntaje</dt>
            <dd className="mt-1 font-pixel text-sm text-amber-400">{formatNumber(entry.score)}</dd>
          </div>
          <div className="border-2 border-paper-300 bg-paper-100/60 p-2">
            <dt className="label-pixel">Capturas</dt>
            <dd className="mt-1 font-pixel text-sm text-ink-900">{formatNumber(entry.captureCount)}</dd>
          </div>
        </dl>
      </Link>
    </li>
  )
}

interface RankingRowProps {
  position: number
  entry: UserResponse
  isCurrent: boolean
}

function RankingRow({ position, entry, isCurrent }: RankingRowProps) {
  return (
    <li
      className={cx(
        'border-b-2 border-l-2 border-b-paper-200 last:border-b-0',
        isCurrent ? 'border-l-poke-500' : 'border-l-transparent',
      )}
    >
      <Link
        to={`/usuarios/${entry.userId}`}
        className={cx(
          'grid items-center gap-2 px-3 py-2.5 transition-colors hover:bg-paper-100 active:bg-paper-100 sm:px-4 sm:py-3',
          ROW_GRID,
          isCurrent && 'bg-poke-700/10',
        )}
      >
        <span className={cx('font-pixel text-sm', isCurrent ? 'text-poke-400' : 'text-ink-500')}>{position}</span>

        <span className="flex min-w-0 items-center gap-2.5">
          <Avatar name={entry.name} photoUrl={entry.photoUrl} size="sm" />
          <span className="min-w-0">
            <span className="flex min-w-0 items-center gap-2">
              <span className="line-clamp-2 font-pixel text-xs leading-tight text-ink-900 sm:line-clamp-1">{entry.name}</span>
              {isCurrent && <Badge tone="brand">vos</Badge>}
            </span>
            <span className="mt-1 block font-pixel text-[0.5625rem] uppercase tracking-[0.04em] text-ink-400 sm:hidden">
              {formatNumber(entry.captureCount)} capturas
            </span>
          </span>
        </span>

        <span className="text-right font-pixel text-xs text-amber-400">{formatNumber(entry.score)}</span>
        <span className="hidden text-right font-pixel text-xs text-ink-700 sm:block">
          {formatNumber(entry.captureCount)}
        </span>
      </Link>
    </li>
  )
}
