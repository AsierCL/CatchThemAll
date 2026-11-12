import { cx } from '../../lib/cx'
import { initials } from '../../lib/format'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg'

const SIZES: Record<AvatarSize, string> = {
  xs: 'size-7 text-[0.5rem]',
  sm: 'size-9 text-[0.625rem]',
  md: 'size-12 text-xs',
  lg: 'size-20 text-lg',
}

const PALETTE = [
  'bg-poke-100 text-poke-700 border-poke-300',
  'bg-sky-400/10 text-sky-400 border-sky-400/40',
  'bg-violet-400/10 text-violet-400 border-violet-400/40',
  'bg-amber-400/10 text-amber-400 border-amber-400/40',
  'bg-rose-400/10 text-rose-400 border-rose-400/40',
]

function paletteFor(seed: string): string {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.codePointAt(0)!) % 997
  return PALETTE[hash % PALETTE.length]
}

interface AvatarProps {
  name: string
  photoUrl?: string
  size?: AvatarSize
  className?: string
}

/**
 * Retrato con marco duro. Si no hay `photoUrl` (las vistas `Basic` no la traen)
 * se muestra un bloque de iniciales con color estable por nombre.
 */
export function Avatar({ name, photoUrl, size = 'md', className }: AvatarProps) {
  const base = cx('shrink-0 border-2 object-cover', SIZES[size], className)

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`Foto de ${name}`}
        loading="lazy"
        className={cx(base, 'border-paper-400 bg-paper-100')}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={cx(base, 'inline-flex items-center justify-center font-pixel uppercase', paletteFor(name))}
    >
      {initials(name)}
    </span>
  )
}
