import { Button } from './Button'

interface PaginationProps {
  page: number
  pageCount: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  label?: string
}

/** Navegacion de paginas para listas paginadas en cliente. */
export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
  label = 'Paginación',
}: PaginationProps) {
  if (pageCount <= 1) return null

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <nav
      aria-label={label}
      className="flex flex-col items-center justify-between gap-3 border-2 border-paper-200 bg-paper-100/60 px-3 py-2 sm:flex-row"
    >
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Página anterior"
      >
        Anterior
      </Button>

      <p role="status" className="font-pixel text-[0.625rem] uppercase tracking-[0.05em] text-ink-500">
        Página {page} de {pageCount} · {from}–{to} de {total}
      </p>

      <Button
        variant="secondary"
        size="sm"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        aria-label="Página siguiente"
      >
        Siguiente
      </Button>
    </nav>
  )
}
