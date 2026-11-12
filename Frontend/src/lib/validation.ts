export interface FieldErrors {
  [field: string]: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** El backend limpia los extremos; replicarlo evita nombres "  " que viajan como vacios. */
export function validateName(value: string): string | undefined {
  const name = value.trim()
  if (name.length === 0) return 'Elegí un nombre de cazador.'
  if (name.length > 64) return 'Máximo 64 caracteres.'
  return undefined
}

export function validateEmail(value: string): string | undefined {
  const email = value.trim()
  if (email.length === 0) return 'Ingresá tu email.'
  if (email.length > 255) return 'Máximo 255 caracteres.'
  if (!EMAIL_PATTERN.test(email)) return 'El email no tiene un formato válido.'
  return undefined
}

export function validatePassword(value: string): string | undefined {
  if (value.length < 8) return 'La contraseña necesita al menos 8 caracteres.'
  if (value.length > 72) return 'La contraseña no puede superar 72 caracteres.'
  return undefined
}

export function validateBirthDate(value: string): string | undefined {
  if (!value) return 'Ingresá tu fecha de nacimiento.'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return 'La fecha no es válida.'

  const today = new Date()
  today.setHours(23, 59, 59, 999)
  if (date.getTime() > today.getTime()) return 'La fecha no puede estar en el futuro.'
  return undefined
}

/** El backend guarda hasta 512 caracteres la URL de la foto. */
export function validatePhotoUrl(value: string): string | undefined {
  const url = value.trim()
  if (url.length === 0) return undefined
  if (url.length > 512) return 'Máximo 512 caracteres.'
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'Tiene que ser una URL http o https.'
    }
  } catch {
    return 'La URL no es válida.'
  }
  return undefined
}

export function validateDescription(value: string): string | undefined {
  if (value.length > 255) return 'Máximo 255 caracteres.'
  return undefined
}

/** Cuenta los errores reales de un mapa de validacion. */
export function countErrors(errors: FieldErrors): number {
  return Object.values(errors).filter(Boolean).length
}
