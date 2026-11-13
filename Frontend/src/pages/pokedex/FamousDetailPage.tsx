import { Link, useParams } from 'react-router-dom'
import { famousApi } from '../../api/endpoints'
import type { FamousResponse } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/ui/Button'
import { ErrorState, LoadingBlock } from '../../components/ui/Feedback'
import { Panel } from '../../components/ui/Panel'
import { PixelIcon } from '../../components/ui/PixelIcon'
import { cx } from '../../lib/cx'
import { CATEGORY_META, formatPokedexNumber, TYPE_META } from '../../lib/domain'
import { formatNumber } from '../../lib/format'
import { useAsync } from '../../lib/useAsync'

function Stat({
  label,
  value,
  icon,
  valueClassName,
}: {
  label: string
  value: string
  icon: 'camera' | 'users' | 'spark'
  valueClassName?: string
}) {
  return (
    <div className="min-w-0 border-2 border-paper-200 bg-paper-100/60 p-2.5 sm:p-3">
      <p className="label-pixel flex min-w-0 items-center gap-1.5">
        <PixelIcon name={icon} size={11} className="hidden sm:block" />
        <span className="truncate">{label}</span>
      </p>
      <p className={cx('mt-1 truncate font-pixel text-sm text-ink-900 sm:text-base', valueClassName)}>{value}</p>
    </div>
  )
}

export function FamousDetailPage() {
  const { famousId } = useParams<{ famousId: string }>()
  const { status } = useAuth()

  const { data, error, loading, reload } = useAsync<FamousResponse>(
    () => famousApi.get(famousId ?? ''),
    [famousId],
  )

  const captureTarget = `/capturar?famoso=${famousId ?? ''}`

  if (loading && !data) return <LoadingBlock label="Abriendo la ficha" />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!data) return null

  const category = CATEGORY_META[data.category]
  const type = TYPE_META[data.type]

  return (
    <div className="space-y-6">
      <Link
        to="/pokedex"
        className="inline-flex items-center gap-1.5 font-pixel text-[0.625rem] uppercase tracking-[0.06em] text-ink-500 transition-colors hover:text-ink-900 max-sm:min-h-11"
      >
        <PixelIcon name="arrowLeft" size={12} />
        Volver al catálogo
      </Link>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Panel elevation="raised" className={cx('relative overflow-hidden', category.border)}>
          <div className="pixel-grid-bg pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />

          <div className="relative space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className={cx('font-pixel text-sm tracking-[0.1em]', category.text)}>
                {formatPokedexNumber(data.pokedexNumber)}
              </span>
              <div className="flex flex-wrap gap-2">
                <span
                  className={cx(
                    'border px-2 py-0.5 font-pixel text-[0.5625rem] uppercase tracking-[0.06em]',
                    category.text,
                    category.border,
                    category.bg,
                  )}
                >
                  {category.label}
                </span>
                <span
                  className={cx(
                    'border px-2 py-0.5 font-pixel text-[0.5625rem] uppercase tracking-[0.06em]',
                    type.text,
                    type.border,
                    type.bg,
                  )}
                >
                  {type.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="border-2 border-paper-300 bg-paper-100 p-4 text-poke-500 shadow-pixel-sm">
                <PixelIcon name="ball" size={56} accentColor="var(--color-ink-900)" />
              </span>
              <div className="min-w-0">
                <h1 className="font-pixel text-xl leading-tight text-ink-900 sm:text-2xl">{data.name}</h1>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
                  {data.category === 'legendary'
                    ? 'Una leyenda del catálogo. Muy pocos cazadores pueden presumir esta captura.'
                    : data.category === 'epic'
                      ? 'Una pieza difícil de encontrar. Su similitud facial exige una buena foto.'
                      : data.category === 'rare'
                        ? 'Un famoso esquivo, pero alcanzable con paciencia y buena luz.'
                        : 'Un clásico del catálogo: ideal para empezar la colección.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Stat label="Capturas" value={formatNumber(data.captureCount)} icon="camera" />
              <Stat label="Cazadores" value={formatNumber(data.collectorCount)} icon="users" />
              <Stat label="Rareza" value={category.label} icon="spark" valueClassName="max-sm:text-[0.625rem] max-sm:leading-6" />
            </div>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel className="space-y-3">
            <h2 className="font-pixel text-sm text-ink-900">Capturar a {data.name}</h2>
            <p className="text-sm leading-relaxed text-ink-500">
              Subí una foto del famoso o usá la cámara. El reconocimiento facial compara el rostro y registra la
              captura a tu nombre.
            </p>
            {status === 'authenticated' ? (
              <Link to={captureTarget} className="block">
                <Button fullWidth icon={<PixelIcon name="camera" size={14} />}>
                  Ir a capturar
                </Button>
              </Link>
            ) : (
              <Link to="/login" state={{ from: captureTarget }} className="block">
                <Button fullWidth icon={<PixelIcon name="lock" size={14} />}>
                  Entrar para capturar
                </Button>
              </Link>
            )}
            <p className="text-[0.6875rem] leading-relaxed text-ink-400">
              Necesitás una foto con el rostro visible. Las imágenes de más de 10 MB se rechazan.
            </p>
          </Panel>

          <Panel tone="muted" className="space-y-2">
            <h2 className="label-pixel">Datos de la ficha</h2>
            <dl className="space-y-1.5 text-[0.6875rem]">
              <div className="flex justify-between gap-2">
                <dt className="text-ink-400">Identificador</dt>
                <dd className="truncate font-mono text-ink-600" title={data.famousId}>
                  {data.famousId.slice(0, 8)}…
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-400">Tipo</dt>
                <dd className={type.text}>{type.label}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-400">Rareza</dt>
                <dd className={category.text}>{category.label}</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  )
}
