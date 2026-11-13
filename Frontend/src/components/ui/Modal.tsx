import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../lib/cx'
import { Button } from './Button'
import { PixelIcon } from './PixelIcon'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

/**
 * Dialogo propio (sin dependencias): cierra con Escape o con el fondo, bloquea
 * el scroll de la pagina y devuelve el foco al elemento anterior.
 */
export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const { overflow } = document.body.style
    const htmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    const frame = window.requestAnimationFrame(() => {
      const target = panelRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      target?.focus()
    })

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = overflow
      document.documentElement.style.overflow = htmlOverflow
      previouslyFocused.current?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Cerrar"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink-900/55"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
        className={cx(
          'relative flex max-h-[92dvh] w-full animate-rise flex-col border-2 border-paper-400 bg-paper-0 shadow-pixel-lg sm:max-h-[85dvh]',
          SIZES[size],
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b-2 border-paper-300 p-4">
          <div className="min-w-0 space-y-1">
            <h2 id="modal-title" className="font-pixel text-sm text-ink-900">
              {title}
            </h2>
            {description && (
              <p id="modal-description" className="text-xs leading-relaxed text-ink-500">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar diálogo"
            className="-m-1 flex size-10 shrink-0 items-center justify-center border-2 border-transparent text-ink-500 transition-colors hover:border-paper-300 hover:text-ink-900"
          >
            <PixelIcon name="close" size={16} />
          </button>
        </header>

        {children && (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">{children}</div>
        )}

        {footer && (
          <footer className="grid shrink-0 gap-2 border-t-2 border-paper-300 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] [&>button]:w-full sm:flex sm:flex-wrap sm:justify-end sm:pb-4 sm:[&>button]:w-auto">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'danger' : 'primary'} size="sm" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  )
}
