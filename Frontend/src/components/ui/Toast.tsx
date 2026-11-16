import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { PixelIcon, type IconName } from './PixelIcon'

type ToastTone = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  tone: ToastTone
  title: string
  message?: string
}

interface ToastContextValue {
  push: (toast: Omit<ToastItem, 'id'>) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TONE_STYLES: Record<ToastTone, { frame: string; icon: IconName; iconClass: string }> = {
  success: { frame: 'border-leaf-500', icon: 'check', iconClass: 'text-leaf-500' },
  error: { frame: 'border-rose-400/80', icon: 'warning', iconClass: 'text-rose-400' },
  info: { frame: 'border-sky-400/70', icon: 'spark', iconClass: 'text-sky-400' },
}

const AUTO_DISMISS_MS = 6000
const TOAST_LIMIT = 3
const CAN_USE_POPOVER = typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype

function isPopoverOpen(element: HTMLElement): boolean {
  if (!CAN_USE_POPOVER) return false
  try {
    return element.matches(':popover-open')
  } catch {
    return false
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [announcement, setAnnouncement] = useState('')
  const nextId = useRef(1)
  const timers = useRef(new Map<number, number>())
  const regionRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer !== undefined) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }

    const region = regionRef.current
    const focusWasInside = Boolean(region && region.contains(document.activeElement))
    setToasts((current) => current.filter((toast) => toast.id !== id))

    if (focusWasInside) {
      window.requestAnimationFrame(() => {
        const nextButton = regionRef.current?.querySelector<HTMLElement>('button')
        if (nextButton) nextButton.focus()
        else previousFocus.current?.focus()
      })
    }
  }, [])

  const scheduleDismiss = useCallback(
    (id: number) => {
      const run = () => {
        const region = regionRef.current
        // No cerrar un toast que el usuario esta leyendo o tiene enfocado.
        if (region && (region.contains(document.activeElement) || region.matches(':hover'))) {
          timers.current.set(id, window.setTimeout(run, AUTO_DISMISS_MS))
          return
        }
        dismiss(id)
      }
      timers.current.set(id, window.setTimeout(run, AUTO_DISMISS_MS))
    },
    [dismiss],
  )

  const push = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = nextId.current++
      const region = regionRef.current
      if (region && !isPopoverOpen(region)) {
        previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      }

      setToasts((current) => [...current.slice(-(TOAST_LIMIT - 1)), { ...toast, id }])
      setAnnouncement([toast.title, toast.message].filter(Boolean).join('. '))
      scheduleDismiss(id)
    },
    [scheduleDismiss],
  )

  // Mantiene el contenedor visual en el top layer para que no quede detras de
  // un `<dialog>` abierto, y lo cierra cuando no quedan notificaciones.
  useEffect(() => {
    const region = regionRef.current
    if (!region || !CAN_USE_POPOVER) return

    try {
      if (toasts.length > 0 && !isPopoverOpen(region)) region.showPopover()
      else if (toasts.length === 0 && isPopoverOpen(region)) region.hidePopover()
    } catch {
      // El popover ya no esta conectado (desmontaje); no hay nada que hacer.
    }
  }, [toasts.length])

  useEffect(() => {
    const pending = timers.current
    return () => {
      for (const timer of pending.values()) window.clearTimeout(timer)
      pending.clear()
    }
  }, [])

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (title, message) => push({ tone: 'success', title, message }),
      error: (title, message) => push({ tone: 'error', title, message }),
      info: (title, message) => push({ tone: 'info', title, message }),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Region viva separada del popover: el contenido visible entra y sale del
          top layer, pero el anuncio para lectores de pantalla siempre vive en el DOM. */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      <div
        ref={regionRef}
        popover={CAN_USE_POPOVER ? 'manual' : undefined}
        role="region"
        aria-label="Notificaciones"
        className={cx('toast-region', !CAN_USE_POPOVER && 'toast-region-fallback')}
      >
        {toasts.map((toast) => {
          const styles = TONE_STYLES[toast.tone]
          return (
            <div
              key={toast.id}
              className={cx(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 border-2 bg-paper-0 p-3 shadow-pixel animate-rise',
                styles.frame,
              )}
            >
              <PixelIcon name={styles.icon} size={16} className={styles.iconClass} />
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="font-pixel text-[0.6875rem] uppercase tracking-[0.05em] text-ink-900">{toast.title}</p>
                {toast.message && <p className="text-xs leading-relaxed text-ink-500">{toast.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Descartar notificación"
                className="-m-2 flex size-11 shrink-0 items-center justify-center text-ink-400 transition-colors hover:text-ink-900"
              >
                <PixelIcon name="close" size={12} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return context
}
