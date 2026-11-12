import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '../ui/Button'
import { Panel } from '../ui/Panel'
import { PixelIcon } from '../ui/PixelIcon'

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Ultimo recurso: si una pantalla rompe en tiempo de render, el sitio no queda
 * en blanco y se puede volver al inicio sin recargar.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Error no controlado en la interfaz', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="mx-auto max-w-lg py-16">
        <Panel className="space-y-4 text-center">
          <span className="inline-block border-2 border-rose-400/50 bg-rose-400/10 p-2 text-rose-400">
            <PixelIcon name="warning" size={22} />
          </span>
          <h1 className="font-pixel text-base text-ink-900">La consola se trabó</h1>
          <p className="text-sm leading-relaxed text-ink-500">
            Algo falló al dibujar esta pantalla. Podés reintentar desde el inicio; si vuelve a pasar, recargá la
            página.
          </p>
          <div className="flex justify-center gap-2">
            <Button size="sm" onClick={() => this.setState({ error: null })}>
              Reintentar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.location.assign('/')}>
              Volver al inicio
            </Button>
          </div>
        </Panel>
      </div>
    )
  }
}
