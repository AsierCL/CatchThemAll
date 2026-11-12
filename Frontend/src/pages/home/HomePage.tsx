import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { PixelIcon } from '../../components/ui/PixelIcon'
import { CATEGORY_META, CATEGORY_ORDER } from '../../lib/domain'
import { cx } from '../../lib/cx'

const STEPS = [
  {
    number: '01',
    title: 'Elegí un famoso',
    body: 'Recorré el catálogo por rareza o tipo y abrí su ficha. Ahí vas a ver cuántos cazadores ya lo atraparon.',
    icon: 'grid' as const,
  },
  {
    number: '02',
    title: 'Sacá o subí una foto',
    body: 'El reconocimiento facial compara el rostro con las muestras del famoso. Necesitás una cara visible y buena luz.',
    icon: 'camera' as const,
  },
  {
    number: '03',
    title: 'Sumá puntos',
    body: 'Cada primera captura suma puntaje según la similitud y la rareza. Después competís en el ranking con tus amigos.',
    icon: 'spark' as const,
  },
]

export function HomePage() {
  const { status, user } = useAuth()
  const authenticated = status === 'authenticated'

  return (
    <div className="space-y-12">
      <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <p className="inline-flex items-center gap-2 border-2 border-paper-300 bg-paper-0 px-2.5 py-1 font-pixel text-[0.625rem] uppercase tracking-[0.08em] text-poke-400">
            <PixelIcon name="ball" size={12} accentColor="var(--color-ink-900)" />
            Pokédex de famosos
          </p>

          <h1 className="font-pixel text-2xl leading-tight text-ink-900 sm:text-4xl">
            CATCH<span className="text-poke-500">THEM</span>ALL
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-ink-600">
            Un Pokémon Go de famosos, sin salir de casa: elegí una celebridad, subí una foto y dejá que el
            reconocimiento facial confirme la captura. Coleccioná rarezas, sumá puntos y competí con tus amigos.
          </p>

          <div className="flex flex-wrap gap-3">
            {authenticated ? (
              <>
                <Link to="/capturar">
                  <Button size="lg" icon={<PixelIcon name="camera" size={15} />}>
                    Capturar ahora
                  </Button>
                </Link>
                <Link to="/pokedex">
                  <Button variant="secondary" size="lg">
                    Ver mi Pokédex
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/registro">
                  <Button size="lg" icon={<PixelIcon name="ball" size={15} />}>
                    Empezar a capturar
                  </Button>
                </Link>
                <Link to="/pokedex">
                  <Button variant="secondary" size="lg">
                    Explorar el catálogo
                  </Button>
                </Link>
              </>
            )}
          </div>

          {authenticated && user && (
            <p className="font-pixel text-[0.625rem] uppercase tracking-[0.06em] text-ink-400">
              Sesión activa como <span className="text-ink-700">{user.name}</span> · {user.captureCount} capturas
            </p>
          )}
        </div>

        <Panel elevation="raised" className="relative overflow-hidden">
          <div className="pixel-grid-bg pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
          <div className="relative space-y-4">
            <div className="flex items-center justify-between">
              <span className="label-pixel">Consola de captura</span>
              <span className="animate-blink font-pixel text-[0.625rem] text-poke-500">●</span>
            </div>
            <div className="flex justify-center py-2 text-poke-500">
              <PixelIcon name="ball" size={76} accentColor="var(--color-ink-900)" className="animate-float" />
            </div>
            <div className="space-y-1.5 border-t-2 border-paper-200 pt-3 font-pixel text-[0.5625rem] uppercase tracking-[0.05em] text-ink-500">
              <p className="flex justify-between gap-2">
                <span>Cámara</span>
                <span className="text-poke-500">lista</span>
              </p>
              <p className="flex justify-between gap-2">
                <span>Reconocimiento</span>
                <span className="text-amber-400">en línea</span>
              </p>
              <p className="flex justify-between gap-2">
                <span>Ranking</span>
                <span className="text-sky-400">abierto</span>
              </p>
            </div>
          </div>
        </Panel>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label-pixel">Cómo funciona</p>
            <h2 className="mt-1 font-pixel text-lg text-ink-900">Tres pasos y una foto</h2>
          </div>
          <Link to="/pokedex" className="font-pixel text-[0.625rem] uppercase tracking-[0.06em] text-poke-400 underline decoration-poke-700 underline-offset-4">
            Ir al catálogo
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step) => (
            <Panel key={step.number} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-pixel text-[0.625rem] text-poke-500">{step.number}</span>
                <span className="text-ink-400">
                  <PixelIcon name={step.icon} size={18} />
                </span>
              </div>
              <h3 className="font-pixel text-sm text-ink-900">{step.title}</h3>
              <p className="text-sm leading-relaxed text-ink-500">{step.body}</p>
            </Panel>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="label-pixel">Rarezas</p>
          <h2 className="mt-1 font-pixel text-lg text-ink-900">Cuanto más raro, más puntos</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORY_ORDER.map((key) => {
            const meta = CATEGORY_META[key]
            return (
              <div key={key} className={cx('flex items-center gap-3 border-2 bg-paper-0 p-3', meta.border)}>
                <span className={cx('size-3 shrink-0', meta.dot)} aria-hidden="true" />
                <div>
                  <p className={cx('font-pixel text-[0.625rem] uppercase tracking-[0.06em]', meta.text)}>{meta.label}</p>
                  <p className="mt-0.5 text-[0.6875rem] text-ink-400">
                    {key === 'legendary'
                      ? 'Iconos del catálogo'
                      : key === 'epic'
                        ? 'Difíciles de encontrar'
                        : key === 'rare'
                          ? 'Esquivos pero posibles'
                          : 'Para empezar la colección'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {!authenticated && (
        <section className="border-2 border-paper-300 bg-paper-100/70 p-6 text-center shadow-pixel sm:p-10">
          <h2 className="font-pixel text-lg text-ink-900 sm:text-xl">Tu Pokédex no se llena solo</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ink-500">
            Creá tu cuenta en menos de un minuto, capturá tu primer famoso y entrá al ranking de cazadores.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/registro">
              <Button size="lg">Crear cuenta</Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="lg">
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
