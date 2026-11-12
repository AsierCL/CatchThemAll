import { Link } from 'react-router-dom'
import { capturesApi } from '../../api/endpoints'
import type { CaptureResponse } from '../../api/types'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState, ErrorState, LoadingBlock } from '../../components/ui/Feedback'
import { PixelIcon, type IconName } from '../../components/ui/PixelIcon'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { formatSimilarity, similarityTier } from '../../lib/domain'
import { formatDateTime, formatNumber, formatRelative } from '../../lib/format'
import { useAsync } from '../../lib/useAsync'

interface StatCardProps {
  label: string
  value: string
  icon: IconName
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="border-2 border-paper-300 bg-paper-0 p-4 shadow-pixel-sm">
      <dt className="label-pixel">{label}</dt>
      <dd className="mt-1.5 flex items-center gap-2 font-pixel text-lg text-ink-900">
        <PixelIcon name={icon} size={14} className="text-ink-400" />
        {value}
      </dd>
    </div>
  )
}

function CaptureRow({ capture }: { capture: CaptureResponse }) {
  const tier = similarityTier(capture.similarity)

  return (
    <li className="border-2 border-paper-300 bg-paper-0 p-4 shadow-pixel-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/pokedex/${capture.famousId}`}
            className="font-pixel text-sm text-ink-900 underline-offset-4 hover:text-poke-400 hover:underline"
          >
            {capture.famousName}
          </Link>
          <p className="mt-1 text-xs text-ink-400" title={formatDateTime(capture.timestamp)}>
            {formatRelative(capture.timestamp)}
          </p>
        </div>
        <Badge tone={capture.captured ? 'neutral' : 'brand'}>
          {capture.captured ? 'Repetida' : 'Nueva'}
        </Badge>
      </div>

      <ProgressBar
        value={capture.similarity}
        tone={tier.tone}
        label={tier.label}
        showValue
        className="mt-3"
      />
    </li>
  )
}

export function MyPokedexPage() {
  const { data, error, loading, reload } = useAsync(() => capturesApi.mine(), [])
  const captures = data ?? []

  const distinctCount = new Set(captures.map((capture) => capture.famousId)).size
  const bestSimilarity = captures.reduce((max, capture) => Math.max(max, capture.similarity), 0)

  const showEmpty = !loading && !error && captures.length === 0

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="label-pixel">Historial propio</p>
        <h1 className="font-pixel text-xl text-ink-900 sm:text-2xl">Mi Pokédex</h1>
        <p className="max-w-xl text-sm leading-relaxed text-ink-500">
          El registro de tus capturas, con la similitud de cada intento.
        </p>
      </header>

      {loading ? (
        <LoadingBlock label="Cargando capturas" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : showEmpty ? (
        <EmptyState
          icon="camera"
          title="Todavía no capturaste a nadie"
          description="Sacá una foto o subí un archivo para sumar tu primer famoso a la Pokédex."
          action={
            <Link to="/capturar">
              <Button icon={<PixelIcon name="camera" size={14} />}>Ir a capturar</Button>
            </Link>
          }
        />
      ) : (
        <>
          <section aria-label="Estadísticas del historial">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard label="Total de capturas" value={formatNumber(captures.length)} icon="camera" />
              <StatCard label="Famosos distintos" value={formatNumber(distinctCount)} icon="ball" />
              <StatCard label="Mejor similitud" value={formatSimilarity(bestSimilarity)} icon="spark" />
            </dl>
          </section>

          <section aria-label="Historial de capturas" className="space-y-4">
            <h2 className="font-pixel text-lg text-ink-900">Historial</h2>
            <ul className="space-y-3">
              {captures.map((capture) => (
                <CaptureRow key={capture.captureId} capture={capture} />
              ))}
            </ul>
          </section>
        </>
      )}

      <p className="text-xs text-ink-400">
        El historial se sirve de una caché de hasta 15 minutos, así que una captura recién hecha puede
        tardar en aparecer.
      </p>
    </div>
  )
}
