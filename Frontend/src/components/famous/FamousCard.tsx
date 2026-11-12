import { Link } from 'react-router-dom'
import type { FamousResponse } from '../../api/types'
import { formatNumber } from '../../lib/format'
import { CATEGORY_META, formatPokedexNumber, TYPE_META } from '../../lib/domain'
import { cx } from '../../lib/cx'
import { PixelIcon } from '../ui/PixelIcon'

interface FamousCardProps {
  famous: FamousResponse
  className?: string
}

/**
 * Ficha de catalogo. El color de la rareza aparece solo en el borde y en los
 * numeros, para que la grilla se lea tranquila.
 */
export function FamousCard({ famous, className }: FamousCardProps) {
  const category = CATEGORY_META[famous.category]
  const type = TYPE_META[famous.type]

  return (
    <Link
      to={`/pokedex/${famous.famousId}`}
      className={cx(
        'group relative flex flex-col gap-3 border-2 bg-paper-0 p-4 transition-[transform,box-shadow,border-color] duration-150',
        category.border,
        'shadow-pixel-sm hover:-translate-y-0.5 hover:shadow-pixel',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cx('font-pixel text-[0.6875rem] tracking-[0.08em]', category.text)}>
          {formatPokedexNumber(famous.pokedexNumber)}
        </span>
        <span className={cx('border px-1.5 py-0.5 font-pixel text-[0.5625rem] uppercase', category.text, category.border, category.bg)}>
          {category.label}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span
          className="border-2 border-paper-300 bg-paper-100 p-2 text-poke-500 transition-colors group-hover:text-poke-600"
          aria-hidden="true"
        >
          <PixelIcon name="ball" size={26} accentColor="var(--color-ink-900)" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate font-pixel text-[0.8125rem] leading-snug text-ink-900">{famous.name}</h3>
          <p className={cx('mt-1 font-pixel text-[0.5625rem] uppercase tracking-[0.06em]', type.text)}>{type.label}</p>
        </div>
      </div>

      <dl className="mt-auto grid grid-cols-2 gap-2 border-t-2 border-paper-200 pt-2.5 text-[0.6875rem]">
        <div>
          <dt className="label-pixel">Capturas</dt>
          <dd className="flex items-center gap-1 font-pixel text-[0.6875rem] text-ink-700">
            <PixelIcon name="camera" size={11} className="text-ink-400" />
            {formatNumber(famous.captureCount)}
          </dd>
        </div>
        <div>
          <dt className="label-pixel">Cazadores</dt>
          <dd className="flex items-center gap-1 font-pixel text-[0.6875rem] text-ink-700">
            <PixelIcon name="users" size={11} className="text-ink-400" />
            {formatNumber(famous.collectorCount)}
          </dd>
        </div>
      </dl>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 transition-opacity group-hover:opacity-40"
      />
    </Link>
  )
}
