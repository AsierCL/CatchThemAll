import type { ReactNode } from 'react'
import { PixelIcon } from '../../components/ui/PixelIcon'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

/**
 * Marco de las pantallas de acceso: formulario a la izquierda y una "consola de
 * Pokedex" decorativa a la derecha, solo en pantallas grandes.
 */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="border-2 border-paper-300 bg-paper-0 p-5 shadow-pixel sm:p-8">
        <div className="mb-6 space-y-2">
          <p className="label-pixel">Acceso de cazadores</p>
          <h1 className="font-pixel text-lg text-ink-900 sm:text-xl">{title}</h1>
          <p className="text-sm leading-relaxed text-ink-500">{subtitle}</p>
        </div>

        {children}

        <div className="mt-6 border-t-2 border-paper-200 pt-4 text-sm text-ink-500">{footer}</div>
      </section>

      <aside aria-hidden="true" className="hidden flex-col gap-4 lg:flex">
        <div className="pixel-grid-bg border-2 border-paper-300 bg-paper-100/70 p-5">
          <p className="label-pixel mb-4">Sistema</p>
          <div className="mb-6 flex items-center justify-between">
            <span className="text-poke-500">
              <PixelIcon name="ball" size={44} accentColor="var(--color-ink-900)" />
            </span>
            <span className="text-right font-pixel text-[0.625rem] leading-relaxed text-ink-500">
              POKÉDEX
              <br />
              v0.0.1
            </span>
          </div>
          <ul className="space-y-2 font-pixel text-[0.625rem] uppercase tracking-[0.05em] text-ink-500">
            <li className="flex items-center justify-between gap-2 border-b border-paper-200 pb-1.5">
              <span>Catálogo</span>
              <span className="text-poke-500">listo</span>
            </li>
            <li className="flex items-center justify-between gap-2 border-b border-paper-200 pb-1.5">
              <span>Reconocimiento</span>
              <span className="text-amber-400">en línea</span>
            </li>
            <li className="flex items-center justify-between gap-2">
              <span>Cazadores</span>
              <span className="text-sky-400">conectados</span>
            </li>
          </ul>
          <p className="mt-6 flex items-center gap-1 font-pixel text-[0.625rem] text-ink-400">
            <span className="animate-blink text-poke-500">■</span> esperando credenciales
          </p>
        </div>
      </aside>
    </div>
  )
}
