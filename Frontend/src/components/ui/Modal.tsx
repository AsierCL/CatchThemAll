import {
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type ReactNode,
  type SyntheticEvent,
} from 'react'
import { createPortal } from 'react-dom'
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
  /** Bloquea Escape, el backdrop y el boton de cerrar mientras hay una operacion en curso. */
  preventClose?: boolean
}

const MAX_WIDTH: Record<NonNullable<ModalProps['size']>, string> = {
  sm: '24rem',
  md: '32rem',
  lg: '42rem',
}

/**
 * Dialogo modal sobre el `<dialog>` nativo: el navegador aporta el foco atrapado,
 * el top layer, Escape, la devolucion del foco y el backdrop. Solo se agrega el
 * fallback de light dismiss para Safari, que todavia no soporta `closedby`.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  preventClose = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
      window.requestAnimationFrame(() => {
        dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
      })
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  // Safari no implementa `closedby="any"`: replicamos el light dismiss midiendo
  // la posicion del puntero, no `event.target` (el dialogo tambien es target de
  // su propio padding).
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || preventClose) return
    if ('closedBy' in HTMLDialogElement.prototype) return

    let pressedOutside = false
    const isOutside = (event: PointerEvent) => {
      const rect = dialog.getBoundingClientRect()
      return (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
    }
    const handlePointerDown = (event: PointerEvent) => {
      pressedOutside = isOutside(event)
    }
    const handlePointerUp = (event: PointerEvent) => {
      if (pressedOutside && isOutside(event)) dialog.close()
      pressedOutside = false
    }

    dialog.addEventListener('pointerdown', handlePointerDown)
    dialog.addEventListener('pointerup', handlePointerUp)
    return () => {
      dialog.removeEventListener('pointerdown', handlePointerDown)
      dialog.removeEventListener('pointerup', handlePointerUp)
    }
  }, [preventClose])

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    if (preventClose) event.preventDefault()
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      closedby={preventClose ? 'none' : 'any'}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={handleCancel}
      onClose={onClose}
      className="pixel-dialog"
      style={{ '--dialog-max-width': MAX_WIDTH[size] } as CSSProperties}
    >
      <header className="flex shrink-0 items-start justify-between gap-4 border-b-2 border-paper-300 p-4">
        <div className="min-w-0 space-y-1">
          <h2 id={titleId} className="font-pixel text-sm text-ink-900">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="text-xs leading-relaxed text-ink-500">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={preventClose}
          aria-label="Cerrar diálogo"
          className="-m-1 flex size-11 shrink-0 items-center justify-center border-2 border-transparent text-ink-500 transition-colors hover:border-paper-300 hover:text-ink-900 disabled:cursor-not-allowed disabled:text-ink-400"
        >
          <PixelIcon name="close" size={16} />
        </button>
      </header>

      {children && <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">{children}</div>}

      {footer && (
        <footer className="grid shrink-0 gap-2 border-t-2 border-paper-300 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] [&>button]:w-full sm:flex sm:flex-wrap sm:justify-end sm:pb-4 sm:[&>button]:w-auto">
          {footer}
        </footer>
      )}
    </dialog>,
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
      preventClose={loading}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading} data-autofocus>
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
