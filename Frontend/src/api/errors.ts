import axios from 'axios'
import type { ErrorDTO } from './types'

export type ErrorKind = 'http' | 'network' | 'timeout' | 'unknown'

export interface AppError {
  kind: ErrorKind
  status: number | null
  title: string
  message: string
  details: string[]
}

interface StatusCopy {
  title: string
  message: string
}

/**
 * El backend responde `ErrorDTO` con mensajes tecnicos en ingles. La UI muestra
 * una frase propia por codigo y, cuando aporta algo, agrega `details`.
 */
const STATUS_COPY: Record<number, StatusCopy> = {
  400: { title: 'Datos inválidos', message: 'Revisá los campos del formulario y volvé a intentar.' },
  401: { title: 'Sesión no válida', message: 'Tu sesión venció o las credenciales no son correctas.' },
  403: { title: 'Sin permiso', message: 'Esta acción no está permitida para tu usuario.' },
  404: { title: 'No encontrado', message: 'Ese recurso no existe o no está disponible.' },
  409: { title: 'Ya está en uso', message: 'Ese nombre o email ya está registrado.' },
  413: { title: 'Imagen demasiado grande', message: 'La foto supera el límite de 10 MB. Elegí una más liviana.' },
  415: { title: 'Formato no soportado', message: 'El servidor no acepta ese tipo de contenido.' },
  422: {
    title: 'Foto no utilizable',
    message: 'No pudimos decodificar la imagen o no encontramos una cara en ella.',
  },
  500: {
    title: 'Fallo del servidor',
    message: 'El backend falló al procesar la petición. Volvé a intentar en un momento.',
  },
  503: {
    title: 'Reconocimiento no disponible',
    message: 'El servicio de reconocimiento facial está apagado. La captura no se pudo procesar.',
  },
  504: {
    title: 'Reconocimiento sin respuesta',
    message: 'El servicio de reconocimiento facial tardó demasiado. Intentá de nuevo.',
  },
}

const NETWORK_COPY: StatusCopy = {
  title: 'Sin conexión con la API',
  message: 'No pudimos contactar al servidor. Verificá que el backend esté corriendo en localhost:8080.',
}

const TIMEOUT_COPY: StatusCopy = {
  title: 'La operación tardó demasiado',
  message: 'El servidor no respondió a tiempo. Puede estar procesando el reconocimiento facial.',
}

const UNKNOWN_COPY: StatusCopy = {
  title: 'Algo salió mal',
  message: 'Ocurrió un error inesperado. Volvé a intentar.',
}

function isErrorDTO(value: unknown): value is ErrorDTO {
  return typeof value === 'object' && value !== null
}

export function toAppError(error: unknown): AppError {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return { kind: 'timeout', status: null, details: [], ...TIMEOUT_COPY }
    }

    if (!error.response) {
      return { kind: 'network', status: null, details: [], ...NETWORK_COPY }
    }

    const status = error.response.status
    const body: unknown = error.response.data
    const copy = STATUS_COPY[status] ?? UNKNOWN_COPY
    const serverMessage = isErrorDTO(body) && typeof body.message === 'string' ? body.message : ''
    const details = isErrorDTO(body) && Array.isArray(body.details) ? body.details.filter((d): d is string => typeof d === 'string') : []

    return {
      kind: 'http',
      status,
      title: copy.title,
      message: copy.message,
      // El mensaje del backend es tecnico y en ingles: se muestra como pista, no como titular.
      details: serverMessage ? [...details, serverMessage] : details,
    }
  }

  if (error instanceof Error) {
    return { kind: 'unknown', status: null, title: UNKNOWN_COPY.title, message: error.message, details: [] }
  }

  return { kind: 'unknown', status: null, details: [], ...UNKNOWN_COPY }
}

export function isUnauthorized(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401
}
