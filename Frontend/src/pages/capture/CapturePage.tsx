import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { capturesApi, famousApi, MAX_IMAGE_BYTES } from '../../api/endpoints'
import { toAppError, type AppError } from '../../api/errors'
import type { CaptureResponse, FamousResponse } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/ui/Button'
import { EmptyState, ErrorState, LoadingBlock, Spinner } from '../../components/ui/Feedback'
import { Input } from '../../components/ui/Field'
import { Panel, SectionHeading } from '../../components/ui/Panel'
import { PixelIcon } from '../../components/ui/PixelIcon'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { useToast } from '../../components/ui/Toast'
import { cx } from '../../lib/cx'
import {
  CATEGORY_META,
  TYPE_META,
  formatPokedexNumber,
  formatSimilarity,
  similarityTier,
} from '../../lib/domain'
import { formatDateTime } from '../../lib/format'
import { useAsync } from '../../lib/useAsync'

interface CapturedImage {
  file: File | Blob
  previewUrl: string
  filename: string
  size: number
}

type PhotoMode = 'file' | 'camera'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function cameraErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return 'El navegador bloqueó la cámara. Habilitá el permiso desde el candado de la barra de direcciones.'
    }
    if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') {
      return 'No encontramos ninguna cámara conectada. Podés subir un archivo en su lugar.'
    }
    if (error.name === 'NotReadableError') {
      return 'La cámara está ocupada por otra aplicación. Cerrala y volvé a intentar.'
    }
  }
  return 'No pudimos abrir la cámara. Podés subir un archivo en su lugar.'
}

/** Elige un famoso del catálogo y captura su rostro desde archivo o cámara. */
export function CapturePage() {
  const { user, refreshUser } = useAuth()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<FamousResponse | null>(null)
  const [mode, setMode] = useState<PhotoMode>('file')
  const [image, setImage] = useState<CapturedImage | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<AppError | null>(null)
  const [result, setResult] = useState<CaptureResponse | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  const catalog = useAsync<FamousResponse[]>(() => famousApi.list(), [])
  const targetFromUrl = searchParams.get('famoso')

  // Preseleccion del famoso cuando se llega desde su ficha (?famoso=<uuid>).
  useEffect(() => {
    if (!catalog.data || selected) return
    if (!targetFromUrl) return
    const match = catalog.data.find((famous) => famous.famousId === targetFromUrl)
    if (match) setSelected(match)
  }, [catalog.data, selected, targetFromUrl])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraReady(false)
  }, [])

  const releaseImage = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }, [])

  // Limpieza de camara y URLs de objeto al salir de la pantalla.
  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    },
    [],
  )

  const filteredCatalog = useMemo(() => {
    const term = query.trim().toLowerCase()
    const list = catalog.data ?? []
    const filtered = term ? list.filter((famous) => famous.name.toLowerCase().includes(term)) : list
    return [...filtered].sort((a, b) => a.pokedexNumber - b.pokedexNumber).slice(0, 40)
  }, [catalog.data, query])

  function applyImage(file: File | Blob, filename: string) {
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError(`La imagen pesa ${formatBytes(file.size)} y el límite es 10 MB.`)
      return
    }
    if (file instanceof File && !file.type.startsWith('image/')) {
      setImageError('El archivo tiene que ser una imagen (JPG, PNG, WEBP…).')
      return
    }

    releaseImage()
    const previewUrl = URL.createObjectURL(file)
    objectUrlRef.current = previewUrl
    setImageError(null)
    setSubmitError(null)
    setResult(null)
    setImage({ file, previewUrl, filename, size: file.size })
    stopCamera()
    setMode('file')
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (file) applyImage(file, file.name)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    handleFiles(event.dataTransfer.files)
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    handleFiles(event.target.files)
    event.target.value = ''
  }

  async function openCamera() {
    setCameraError(null)
    setMode('camera')

    if (!window.isSecureContext) {
      setCameraError('La cámara solo funciona en HTTPS o en localhost. Abrí la app desde localhost:5173.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => undefined)
      }
      setCameraReady(true)
    } catch (error) {
      stopCamera()
      setCameraError(cameraErrorMessage(error))
    }
  }

  function takePhoto() {
    const video = videoRef.current
    if (!video || video.videoWidth === 0) {
      setCameraError('La cámara todavía no está lista. Esperá un segundo y volvé a intentar.')
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    if (!context) {
      setCameraError('El navegador no pudo procesar la imagen de la cámara.')
      return
    }

    context.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError('No pudimos generar la foto. Probá otra vez.')
          return
        }
        applyImage(blob, 'captura-camara.png')
        toast.success('Foto capturada', 'Revisá el encuadre y confirmá la captura.')
      },
      'image/jpeg',
      0.92,
    )
  }

  function selectFamous(famous: FamousResponse) {
    setSelected(famous)
    setResult(null)
    setSubmitError(null)
    setSearchParams({ famoso: famous.famousId }, { replace: true })
  }

  function clearFamous() {
    setSelected(null)
    setResult(null)
    setSearchParams({}, { replace: true })
  }

  function resetFlow() {
    releaseImage()
    setImage(null)
    setResult(null)
    setSubmitError(null)
    setImageError(null)
  }

  async function handleSubmit() {
    if (!selected) {
      setImageError('Primero elegí a qué famoso querés capturar.')
      return
    }
    if (!image) {
      setImageError('Necesitás una foto para comparar el rostro.')
      return
    }
    if (!user) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const capture = await capturesApi.identify({
        ownerId: user.userId,
        famousName: selected.name,
        image: image.file,
      })
      setResult(capture)
      stopCamera()

      if (capture.captured) {
        toast.info('Captura repetida', `Ya tenías a ${capture.famousName} en tu Pokédex.`)
      } else {
        toast.success('¡Nueva captura!', `${capture.famousName} quedó registrada con ${formatSimilarity(capture.similarity)} de similitud.`)
      }

      // El puntaje del navbar se recalcula con el perfil; si falla, no rompe el resultado.
      await refreshUser().catch(() => undefined)
    } catch (error) {
      const appError = toAppError(error)
      setSubmitError(appError)
      toast.error(appError.title, appError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Modo captura"
        title="Capturar un famoso"
        description="Elegí a quién vas a capturar y subí una foto reciente, o sacala en el momento. El servicio compara el rostro con las muestras del famoso."
      />

      {result ? (
        <CaptureResult result={result} onAgain={resetFlow} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            {/* Paso 1: famoso */}
            <Panel className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-pixel text-sm text-ink-900">
                  <span className="border-2 border-paper-300 px-1.5 py-0.5 text-[0.625rem] text-poke-500">01</span>
                  Elegí el famoso
                </h2>
                {selected && (
                  <Button variant="ghost" size="sm" onClick={clearFamous}>
                    Cambiar
                  </Button>
                )}
              </div>

              {catalog.loading && !catalog.data ? (
                <LoadingBlock label="Cargando catálogo" />
              ) : catalog.error ? (
                <ErrorState error={catalog.error} onRetry={catalog.reload} />
              ) : selected ? (
                <div className="flex items-center gap-3 border-2 border-poke-700/60 bg-poke-700/10 p-3">
                  <span className="border-2 border-paper-300 bg-paper-100 p-2 text-poke-500">
                    <PixelIcon name="ball" size={22} accentColor="var(--color-ink-900)" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-pixel text-[0.625rem] text-ink-500">
                      {formatPokedexNumber(selected.pokedexNumber)} ·{' '}
                      <span className={CATEGORY_META[selected.category].text}>
                        {CATEGORY_META[selected.category].label}
                      </span>
                    </p>
                    <p className="truncate font-pixel text-sm text-ink-900">{selected.name}</p>
                  </div>
                </div>
              ) : (
                <>
                  <Input
                    label="Buscar en el catálogo"
                    placeholder="Nombre del famoso"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  {filteredCatalog.length === 0 ? (
                    <EmptyState
                      icon="search"
                      title="Sin resultados"
                      description="El famoso tiene que estar cargado en el catálogo para poder capturarlo."
                    />
                  ) : (
                    <ul className="max-h-64 divide-y-2 divide-paper-200 overflow-y-auto border-2 border-paper-200">
                      {filteredCatalog.map((famous) => (
                        <li key={famous.famousId}>
                          <button
                            type="button"
                            onClick={() => selectFamous(famous)}
                            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-paper-100"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="font-pixel text-[0.5625rem] text-ink-400">
                                {formatPokedexNumber(famous.pokedexNumber)}
                              </span>
                              <span className="truncate text-sm text-ink-800">{famous.name}</span>
                            </span>
                            <span className="flex shrink-0 items-center gap-2">
                              <span className={cx('font-pixel text-[0.5625rem] uppercase', TYPE_META[famous.type].text)}>
                                {TYPE_META[famous.type].label}
                              </span>
                              <span className={cx('size-2', CATEGORY_META[famous.category].dot)} aria-hidden="true" />
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </Panel>

            {/* Paso 2: foto */}
            <Panel className="space-y-4">
              <h2 className="flex items-center gap-2 font-pixel text-sm text-ink-900">
                <span className="border-2 border-paper-300 px-1.5 py-0.5 text-[0.625rem] text-poke-500">02</span>
                Foto del rostro
              </h2>

              <div role="tablist" aria-label="Origen de la foto" className="flex gap-2">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'file'}
                  onClick={() => {
                    stopCamera()
                    setMode('file')
                  }}
                  className={cx(
                    'flex flex-1 items-center justify-center gap-2 border-2 px-3 py-2 font-pixel text-[0.625rem] uppercase transition-colors',
                    mode === 'file'
                      ? 'border-poke-700 bg-poke-700/10 text-poke-400'
                      : 'border-paper-200 text-ink-500 hover:border-paper-400 hover:text-ink-800',
                  )}
                >
                  <PixelIcon name="grid" size={13} />
                  Archivo
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'camera'}
                  onClick={() => void openCamera()}
                  className={cx(
                    'flex flex-1 items-center justify-center gap-2 border-2 px-3 py-2 font-pixel text-[0.625rem] uppercase transition-colors',
                    mode === 'camera'
                      ? 'border-poke-700 bg-poke-700/10 text-poke-400'
                      : 'border-paper-200 text-ink-500 hover:border-paper-400 hover:text-ink-800',
                  )}
                >
                  <PixelIcon name="camera" size={13} />
                  Cámara
                </button>
              </div>

              {image ? (
                <div className="space-y-3">
                  <div className="relative border-2 border-paper-300 bg-paper-50 p-2">
                    <img
                      src={image.previewUrl}
                      alt="Vista previa de la foto elegida"
                      className="mx-auto max-h-72 w-auto object-contain"
                    />
                    <span className="absolute left-3 top-3 border-2 border-paper-300 bg-paper-50/90 px-2 py-0.5 font-pixel text-[0.5625rem] uppercase text-poke-400">
                      lista
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="truncate text-[0.6875rem] text-ink-400" title={image.filename}>
                      {image.filename} · {formatBytes(image.size)}
                    </p>
                    <Button variant="ghost" size="sm" onClick={resetFlow}>
                      Elegir otra foto
                    </Button>
                  </div>
                </div>
              ) : mode === 'file' ? (
                <div
                  onDragOver={(event) => {
                    event.preventDefault()
                    setDragging(true)
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={cx(
                    'flex flex-col items-center gap-3 border-2 border-dashed px-6 py-10 text-center transition-colors',
                    dragging ? 'border-poke-500 bg-poke-700/10' : 'border-paper-300 bg-paper-100/40',
                  )}
                >
                  <span className="text-ink-400">
                    <PixelIcon name="camera" size={28} />
                  </span>
                  <p className="text-sm text-ink-700">Arrastrá una foto acá o elegila desde el dispositivo.</p>
                  <p className="text-[0.6875rem] text-ink-400">JPG, PNG o WEBP · hasta 10 MB · un solo rostro visible</p>
                  <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                    Elegir archivo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleFileChange}
                    aria-label="Archivo de imagen"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative border-2 border-paper-300 bg-paper-50">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="mx-auto max-h-72 w-full object-contain"
                      aria-label="Vista previa de la cámara"
                    />
                    {!cameraReady && !cameraError && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Spinner label="Encendiendo cámara" />
                      </div>
                    )}
                  </div>

                  {cameraError ? (
                    <p role="alert" className="flex items-start gap-2 border-2 border-rose-400/50 bg-rose-400/10 p-3 text-xs text-rose-400">
                      <PixelIcon name="warning" size={13} className="mt-0.5" />
                      {cameraError}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={takePhoto} disabled={!cameraReady} icon={<PixelIcon name="camera" size={13} />}>
                        Tomar foto
                      </Button>
                      <Button variant="ghost" size="sm" onClick={stopCamera} disabled={!cameraReady}>
                        Apagar cámara
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {imageError && (
                <p role="alert" className="flex items-start gap-2 border-2 border-rose-400/50 bg-rose-400/10 p-3 text-xs text-rose-400">
                  <PixelIcon name="warning" size={13} className="mt-0.5" />
                  {imageError}
                </p>
              )}
            </Panel>
          </div>

          {/* Resumen y envio */}
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Panel elevation="raised" className="space-y-4">
              <h2 className="font-pixel text-sm text-ink-900">Confirmar captura</h2>
              <dl className="space-y-2 text-[0.6875rem]">
                <div className="flex items-center justify-between gap-2 border-b border-paper-200 pb-1.5">
                  <dt className="text-ink-400">Famoso</dt>
                  <dd className="truncate font-pixel text-[0.625rem] text-ink-800">{selected?.name ?? 'sin elegir'}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-ink-400">Foto</dt>
                  <dd className="font-pixel text-[0.625rem] text-ink-800">
                    {image ? formatBytes(image.size) : 'sin foto'}
                  </dd>
                </div>
              </dl>

              <Button
                fullWidth
                size="lg"
                loading={submitting}
                disabled={!selected || !image}
                onClick={() => void handleSubmit()}
                icon={<PixelIcon name="camera" size={15} />}
              >
                {submitting ? 'Reconociendo' : 'Capturar'}
              </Button>

              {submitting && (
                <p className="text-center text-[0.6875rem] leading-relaxed text-ink-500" role="status">
                  El reconocimiento facial puede tardar unos segundos.
                </p>
              )}

              {submitError && (
                <div role="alert" className="space-y-1 border-2 border-rose-400/50 bg-rose-400/10 p-3">
                  <p className="font-pixel text-[0.625rem] uppercase text-rose-400">{submitError.title}</p>
                  <p className="text-xs leading-relaxed text-ink-600">{submitError.message}</p>
                  {submitError.status === 422 && (
                    <p className="text-[0.6875rem] leading-relaxed text-ink-500">
                      Probá con otra foto: buena luz, rostro de frente y sin otras caras grandes en el encuadre.
                    </p>
                  )}
                </div>
              )}
            </Panel>

            <Panel tone="muted" className="space-y-2">
              <h2 className="label-pixel">Cómo conseguir una buena foto</h2>
              <ul className="space-y-1.5 text-[0.6875rem] leading-relaxed text-ink-500">
                <li>· Un solo rostro, de frente y con buena luz.</li>
                <li>· Sin lentes de sol ni sombras duras.</li>
                <li>· Que la cara ocupe buena parte del encuadre.</li>
                <li>· La primera captura de un famoso suma puntaje al ranking.</li>
              </ul>
            </Panel>
          </div>
        </div>
      )}
    </div>
  )
}

function CaptureResult({ result, onAgain }: { result: CaptureResponse; onAgain: () => void }) {
  const tier = similarityTier(result.similarity)

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Panel elevation="raised" className="space-y-5 border-poke-700/70 text-center">
        <div className="space-y-1">
          <p className="label-pixel">{result.captured ? 'Captura repetida' : 'Nueva captura registrada'}</p>
          <h2 className="font-pixel text-xl text-ink-900">{result.famousName}</h2>
        </div>

        <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
          <span className={cx('border-2 p-4', 'border-poke-700 bg-poke-700/10 text-poke-400')}>
            <PixelIcon name="ball" size={44} accentColor="var(--color-ink-900)" />
          </span>
          <p className="font-pixel text-3xl text-poke-400">{formatSimilarity(result.similarity)}</p>
          <p className="font-pixel text-[0.625rem] uppercase tracking-[0.06em] text-ink-500">{tier.label}</p>
          <ProgressBar value={result.similarity} tone={tier.tone} className="w-full" label="Similitud facial" showValue />
        </div>

        <p className="text-sm leading-relaxed text-ink-500">
          {result.captured
            ? 'Ya tenías esta captura antes de esta petición. Podés volver a intentarlo con otra foto para mejorar la similitud.'
            : 'El famoso quedó registrado en tu Pokédex y sumaste puntaje para el ranking.'}
        </p>

        <p className="text-[0.6875rem] text-ink-400">Registrada el {formatDateTime(result.timestamp)}</p>

        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={onAgain} icon={<PixelIcon name="camera" size={13} />}>
            Capturar otro
          </Button>
          <Link to="/mi-pokedex">
            <Button size="sm" icon={<PixelIcon name="grid" size={13} />}>
              Ver mi Pokédex
            </Button>
          </Link>
          <Link to={`/pokedex/${result.famousId}`}>
            <Button variant="ghost" size="sm">
              Ver la ficha
            </Button>
          </Link>
        </div>
      </Panel>

      <p className="text-center text-[0.6875rem] leading-relaxed text-ink-400">
        El historial de capturas se sirve desde una cache de hasta 15 minutos: si no ves la captura al instante,
        esperá un momento y volvé a entrar.
      </p>
    </div>
  )
}
