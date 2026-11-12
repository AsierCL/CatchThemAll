import type { FamousCategory, FamousType } from '../api/types'

interface CategoryMeta {
  label: string
  /** Clases de color estaticas para que Tailwind las encuentre al compilar. */
  text: string
  border: string
  bg: string
  /** Clase de fondo para puntos de rareza. */
  dot: string
  /** Orden de presentacion: de mas raro a mas comun. */
  weight: number
}

export const CATEGORY_META: Record<FamousCategory, CategoryMeta> = {
  legendary: {
    label: 'Legendario',
    text: 'text-legendary',
    border: 'border-legendary/60',
    bg: 'bg-legendary/10',
    dot: 'bg-legendary',
    weight: 0,
  },
  epic: {
    label: 'Épico',
    text: 'text-epic',
    border: 'border-epic/60',
    bg: 'bg-epic/10',
    dot: 'bg-epic',
    weight: 1,
  },
  rare: {
    label: 'Raro',
    text: 'text-rare',
    border: 'border-rare/60',
    bg: 'bg-rare/10',
    dot: 'bg-rare',
    weight: 2,
  },
  common: {
    label: 'Común',
    text: 'text-common',
    border: 'border-common/50',
    bg: 'bg-common/10',
    dot: 'bg-common',
    weight: 3,
  },
}

export const CATEGORY_ORDER: FamousCategory[] = ['legendary', 'epic', 'rare', 'common']

interface TypeMeta {
  label: string
  text: string
  border: string
  bg: string
}

export const TYPE_META: Record<FamousType, TypeMeta> = {
  politic: { label: 'Político', text: 'text-type-politic', border: 'border-type-politic/50', bg: 'bg-type-politic/10' },
  actor: { label: 'Actor', text: 'text-type-actor', border: 'border-type-actor/50', bg: 'bg-type-actor/10' },
  writer: { label: 'Escritor', text: 'text-type-writer', border: 'border-type-writer/50', bg: 'bg-type-writer/10' },
  musician: { label: 'Músico', text: 'text-type-musician', border: 'border-type-musician/50', bg: 'bg-type-musician/10' },
  teacher: { label: 'Docente', text: 'text-type-teacher', border: 'border-type-teacher/50', bg: 'bg-type-teacher/10' },
  meme: { label: 'Meme', text: 'text-type-meme', border: 'border-type-meme/50', bg: 'bg-type-meme/10' },
}

export const TYPE_ORDER: FamousType[] = ['politic', 'actor', 'writer', 'musician', 'teacher', 'meme']

/** `0.9312` -> `93%`. La similitud llega de 0 a 1. */
export function formatSimilarity(similarity: number): string {
  const safe = Number.isFinite(similarity) ? Math.min(Math.max(similarity, 0), 1) : 0
  return `${Math.round(safe * 100)}%`
}

/**
 * Devuelve una respuesta cualitativa. Los cortes son una ayuda visual, no la
 * formula de puntaje del backend (que no esta documentada numericamente).
 */
export function similarityTier(similarity: number): { label: string; tone: 'brand' | 'sky' | 'amber' | 'rose' } {
  const safe = Number.isFinite(similarity) ? similarity : 0
  if (safe >= 0.9) return { label: 'Coincidencia altísima', tone: 'brand' }
  if (safe >= 0.75) return { label: 'Buena coincidencia', tone: 'sky' }
  if (safe >= 0.6) return { label: 'Coincidencia justa', tone: 'amber' }
  return { label: 'Coincidencia débil', tone: 'rose' }
}

/** Numero de Pokedex con tres digitos, como en la Pokedex clasica. */
export function formatPokedexNumber(value: number): string {
  return `#${String(value).padStart(3, '0')}`
}

export function categoryLabel(category: FamousCategory): string {
  return CATEGORY_META[category]?.label ?? category
}
export function typeLabel(type: FamousType): string {
  return TYPE_META[type]?.label ?? type
}
