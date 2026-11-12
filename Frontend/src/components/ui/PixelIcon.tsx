import { cx } from '../../lib/cx'

type Rect = [x: number, y: number, w: number, h: number]

interface Sprite {
  base: Rect[]
  accent?: Rect[]
}

/**
 * Sprites dibujados con rectangulos sobre una grilla de 16x16, con
 * `shape-rendering: crispEdges` para que no se interpongan bordes suaves.
 */
const SPRITES = {
  ball: {
    base: [
      [6, 1, 4, 1],
      [4, 2, 8, 1],
      [2, 3, 12, 2],
      [1, 5, 14, 2],
      [1, 9, 14, 2],
      [2, 11, 12, 2],
      [4, 13, 8, 1],
      [6, 14, 4, 1],
    ],
    accent: [
      [1, 7, 14, 2],
      [6, 6, 4, 4],
      [7, 7, 2, 2],
    ],
  },
  camera: {
    base: [
      [5, 2, 6, 2],
      [1, 4, 14, 10],
      [3, 14, 10, 1],
    ],
    accent: [
      [5, 7, 6, 5],
      [6, 8, 4, 3],
      [7, 9, 2, 1],
    ],
  },
  trophy: {
    base: [
      [4, 1, 8, 2],
      [3, 3, 10, 4],
      [2, 3, 1, 3],
      [13, 3, 1, 3],
      [4, 7, 8, 2],
      [7, 9, 2, 3],
      [5, 12, 6, 1],
      [4, 13, 8, 2],
    ],
  },
  spark: {
    base: [
      [7, 1, 2, 14],
      [1, 7, 14, 2],
      [4, 4, 2, 2],
      [10, 4, 2, 2],
      [4, 10, 2, 2],
      [10, 10, 2, 2],
    ],
  },
  heart: {
    base: [
      [2, 3, 4, 2],
      [10, 3, 4, 2],
      [1, 5, 14, 2],
      [2, 7, 12, 2],
      [4, 9, 8, 2],
      [6, 11, 4, 2],
      [7, 13, 2, 1],
    ],
  },
  pin: {
    base: [
      [6, 1, 4, 1],
      [4, 2, 8, 2],
      [3, 4, 10, 3],
      [4, 7, 8, 2],
      [5, 9, 6, 2],
      [6, 11, 4, 2],
      [7, 13, 2, 2],
    ],
    accent: [[6, 4, 4, 3]],
  },
  user: {
    base: [
      [6, 2, 4, 1],
      [5, 3, 6, 4],
      [4, 9, 8, 1],
      [3, 10, 10, 5],
    ],
  },
  users: {
    base: [
      [2, 3, 3, 1],
      [1, 4, 5, 3],
      [1, 8, 5, 4],
      [11, 3, 3, 1],
      [10, 4, 5, 3],
      [10, 8, 5, 4],
      [7, 6, 2, 2],
      [5, 10, 6, 3],
    ],
  },
  search: {
    base: [
      [5, 2, 5, 1],
      [3, 3, 1, 5],
      [11, 3, 1, 5],
      [5, 9, 5, 1],
      [9, 8, 2, 2],
      [11, 10, 2, 2],
      [12, 12, 2, 2],
    ],
  },
  flame: {
    base: [
      [7, 1, 2, 2],
      [6, 3, 4, 2],
      [5, 5, 5, 3],
      [4, 8, 8, 4],
      [5, 12, 6, 2],
      [7, 13, 3, 1],
    ],
    accent: [[7, 8, 3, 4]],
  },
  arrowRight: {
    base: [
      [2, 7, 9, 2],
      [9, 5, 2, 2],
      [11, 7, 2, 2],
      [9, 9, 2, 2],
    ],
  },
  arrowLeft: {
    base: [
      [5, 7, 9, 2],
      [5, 5, 2, 2],
      [3, 7, 2, 2],
      [5, 9, 2, 2],
    ],
  },
  close: {
    base: [
      [4, 4, 2, 2],
      [6, 6, 2, 2],
      [8, 8, 2, 2],
      [10, 10, 2, 2],
      [10, 4, 2, 2],
      [8, 6, 2, 2],
      [6, 8, 2, 2],
      [4, 10, 2, 2],
    ],
  },
  check: {
    base: [
      [2, 8, 2, 2],
      [4, 10, 2, 2],
      [6, 8, 2, 2],
      [8, 6, 2, 2],
      [10, 4, 2, 2],
    ],
  },
  warning: {
    base: [
      [7, 2, 2, 2],
      [6, 4, 4, 2],
      [5, 6, 6, 2],
      [4, 8, 8, 2],
      [3, 10, 10, 2],
      [2, 12, 12, 2],
    ],
    accent: [
      [7, 5, 2, 4],
      [7, 11, 2, 2],
    ],
  },
  lock: {
    base: [
      [5, 2, 6, 1],
      [4, 3, 2, 4],
      [10, 3, 2, 4],
      [3, 7, 10, 7],
    ],
    accent: [[7, 9, 2, 3]],
  },
  menu: {
    base: [
      [2, 4, 12, 2],
      [2, 8, 12, 2],
      [2, 12, 12, 2],
    ],
  },
  grid: {
    base: [
      [2, 2, 5, 5],
      [9, 2, 5, 5],
      [2, 9, 5, 5],
      [9, 9, 5, 5],
    ],
  },
  clock: {
    base: [
      [6, 1, 4, 1],
      [4, 2, 8, 1],
      [2, 3, 2, 2],
      [12, 3, 2, 2],
      [1, 5, 2, 6],
      [13, 5, 2, 6],
      [2, 11, 2, 2],
      [12, 11, 2, 2],
      [4, 13, 8, 1],
      [6, 14, 4, 1],
    ],
    accent: [
      [7, 5, 2, 4],
      [8, 8, 3, 2],
    ],
  },
} satisfies Record<string, Sprite>

export type IconName = keyof typeof SPRITES

interface PixelIconProps {
  name: IconName
  size?: number
  accentColor?: string
  className?: string
}

export function PixelIcon({ name, size = 16, accentColor = 'var(--color-ink-900)', className }: PixelIconProps) {
  const sprite: Sprite = SPRITES[name]

  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
      className={cx('shrink-0', className)}
    >
      {sprite.accent?.map(([x, y, w, h], index) => (
        <rect key={`a-${index}`} x={x} y={y} width={w} height={h} fill={accentColor} />
      ))}
      {sprite.base.map(([x, y, w, h], index) => (
        <rect key={`b-${index}`} x={x} y={y} width={w} height={h} fill="currentColor" />
      ))}
    </svg>
  )
}
