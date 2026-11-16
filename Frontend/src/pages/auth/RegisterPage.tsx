import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toAppError } from '../../api/errors'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input, PasswordInput } from '../../components/ui/Field'
import { PixelIcon } from '../../components/ui/PixelIcon'
import { useToast } from '../../components/ui/Toast'
import { announce } from '../../lib/announce'
import { usePageTitle } from '../../lib/usePageTitle'
import {
  validateBirthDate,
  validateEmail,
  validateName,
  validatePassword,
  type FieldErrors,
} from '../../lib/validation'
import { AuthLayout } from './AuthLayout'

const FIELD_ORDER = ['name', 'birthDate', 'email', 'password'] as const
type RegisterField = (typeof FIELD_ORDER)[number]

export function RegisterPage() {
  usePageTitle('Crear cuenta')

  const { register } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState({ name: '', email: '', password: '', birthDate: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const dirty = useRef(new Set<RegisterField>())

  // Mismo criterio que en login: foco inicial solo con teclado y raton.
  useEffect(() => {
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) nameInputRef.current?.focus()
  }, [])

  // Fecha local, no UTC: con `toISOString` el maximo cambiaba de dia a las 21:00
  // en Argentina y dejaba elegir la fecha de manana.
  const [today] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })

  function validateField(field: RegisterField, value: string): string {
    switch (field) {
      case 'name':
        return validateName(value) ?? ''
      case 'email':
        return validateEmail(value) ?? ''
      case 'password':
        return validatePassword(value) ?? ''
      case 'birthDate':
        return validateBirthDate(value) ?? ''
    }
    return ''
  }

  function update(field: RegisterField, value: string) {
    dirty.current.add(field)
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setServerError(null)
  }

  function handleBlur(field: RegisterField) {
    if (!dirty.current.has(field)) return
    const error = validateField(field, form[field])
    setErrors((current) => ({ ...current, [field]: error }))
    if (error && errors[field] !== error) announce(error)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget

    const nextErrors: FieldErrors = {
      name: validateField('name', form.name),
      email: validateField('email', form.email),
      password: validateField('password', form.password),
      birthDate: validateField('birthDate', form.birthDate),
    }
    setErrors(nextErrors)

    if (FIELD_ORDER.some((field) => nextErrors[field])) {
      const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field])
      if (firstInvalid) {
        window.requestAnimationFrame(() => {
          const control = formElement.elements.namedItem(firstInvalid)
          if (control instanceof HTMLElement) control.focus()
        })
      }
      return
    }

    setSubmitting(true)
    setServerError(null)

    try {
      const profile = await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        birthDate: form.birthDate,
      })
      toast.success('Cuenta creada', `Ya podés capturar, ${profile.name}.`)
      navigate('/pokedex', { replace: true })
    } catch (error) {
      const appError = toAppError(error)
      setServerError(
        appError.status === 409
          ? 'Ese nombre o email ya está registrado. Probá con otro.'
          : `${appError.title}. ${appError.message}`,
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Registrate para desbloquear la Pokédex, capturar famosos con una foto y competir en el ranking."
      footer={
        <p>
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="font-semibold text-poke-400 underline decoration-poke-700 underline-offset-4">
            Iniciá sesión
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nombre de cazador"
            name="name"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
            inputRef={nameInputRef}
            placeholder="ada"
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            onBlur={() => handleBlur('name')}
            error={errors.name || undefined}
            maxLength={64}
            required
          />

          <Input
            label="Fecha de nacimiento"
            name="birthDate"
            type="date"
            max={today}
            autoComplete="bday"
            enterKeyHint="next"
            value={form.birthDate}
            onChange={(event) => update('birthDate', event.target.value)}
            onBlur={() => handleBlur('birthDate')}
            error={errors.birthDate || undefined}
            required
          />
        </div>

        <Input
          label="Email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          placeholder="ada@example.com"
          value={form.email}
          onChange={(event) => update('email', event.target.value)}
          onBlur={() => handleBlur('email')}
          error={errors.email || undefined}
          maxLength={255}
          required
        />

        <PasswordInput
          label="Contraseña"
          name="password"
          autoComplete="new-password"
          enterKeyHint="done"
          placeholder="Mínimo 8 caracteres"
          hint="8 a 72 caracteres"
          value={form.password}
          onChange={(event) => update('password', event.target.value)}
          onBlur={() => handleBlur('password')}
          error={errors.password || undefined}
          maxLength={72}
          minLength={8}
          required
        />

        {serverError && (
          <p
            role="alert"
            className="flex items-start gap-2 border-2 border-rose-400/50 bg-rose-400/10 p-3 text-sm text-rose-400"
          >
            <PixelIcon name="warning" size={14} className="mt-0.5" />
            {serverError}
          </p>
        )}

        <Button type="submit" size="lg" fullWidth loading={submitting}>
          {submitting ? 'Creando cuenta' : 'Crear cuenta'}
        </Button>

        <p className="text-[0.6875rem] leading-relaxed text-ink-400">
          Al crear la cuenta aceptás que guardemos tu perfil, tus capturas y el puntaje para el ranking.
        </p>
      </form>
    </AuthLayout>
  )
}
