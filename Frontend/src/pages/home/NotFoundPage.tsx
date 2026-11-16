import { ButtonLink } from '../../components/ui/ButtonLink'
import { Panel } from '../../components/ui/Panel'
import { PixelIcon } from '../../components/ui/PixelIcon'
import { usePageTitle } from '../../lib/usePageTitle'

export function NotFoundPage() {
  usePageTitle('Página no encontrada')

  return (
    <div className="mx-auto max-w-lg">
      <Panel className="space-y-4 text-center">
        <p className="font-pixel text-3xl text-rose-400">404</p>
        <h1 className="font-pixel text-base text-ink-900">Este famoso se escapó</h1>
        <p className="text-sm leading-relaxed text-ink-500">
          La página que buscás no existe o cambió de lugar. Probá volver al catálogo y seguir capturando.
        </p>
        <div className="flex justify-center pb-1 text-ink-400">
          <PixelIcon name="ball" size={44} accentColor="var(--color-ink-900)" className="animate-float" />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <ButtonLink to="/pokedex" size="sm">
            Ir a la Pokédex
          </ButtonLink>
          <ButtonLink to="/" variant="ghost" size="sm">
            Volver al inicio
          </ButtonLink>
        </div>
      </Panel>
    </div>
  )
}
