import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toAppError } from '../../api/errors'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input, PasswordInput } from '../../components/ui/Field'
import { PixelIcon } from '../../components/ui/PixelIcon'
import { useToast } from '../../components/ui/Toast'
import { announce } from '../../lib/announce'
import { usePageTitle } from '../../lib/usePageTitle'
import { validateName, validatePassword, type FieldErrors } from '../../lib/validation'
import { AuthLayout } from './AuthLayout'

interface LocationState {
  from?: string
}

const FIELD_ORDER = ['name', 'password'] as const
type LoginField = (typeof FIELD_ORDER)[number]

export function LoginPage() {
  usePageTitle('Iniciar sesión')

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const [form, setForm] = useState({ name: '', password: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const dirty = useRef(new Set<LoginField>())

  // En escritorio el foco inicial ahorra un clic; en movil abriria el teclado solo.
  useEffect(() => {
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) nameInputRef.current?.focus()
  }, [])

  const from = (location.state as LocationState | null)?.from ?? '/pokedex'

  function validateField(field: LoginField, value: string): string {
    if (field === 'name') return validateName(value) ?? ''
    return validatePassword(value) ?? ''
  }

  function update(field: LoginField, value: string) {
    dirty.current.add(field)
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setServerError(null)
  }

  function handleBlur(field: LoginField) {
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
      password: validateField('password', form.password),
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
      const profile = await login({ name: form.name.trim(), password: form.password })
      toast.success('Sesión iniciada', `Bienvenido de vuelta, ${profile.name}.`)
      navigate(from, { replace: true })
    } catch (error) {
      const appError = toAppError(error)
      // 401 es la respuesta normal de credenciales incorrectas: no es un fallo raro.
      setServerError(
        appError.status === 401 ? 'Usuario o contraseña incorrectos.' : `${appError.title}. ${appError.message}`,
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Iniciar sesión"
      subtitle="Entrá con tu nombre de cazador para volver a tu Pokédex, tu puntaje y tus amigos."
      footer={
        <p>
          ¿Todavía no tenés cuenta?{' '}
          <Link to="/registro" className="font-semibold text-poke-400 underline decoration-poke-700 underline-offset-4">
            Creá una gratis
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

        <PasswordInput
          label="Contraseña"
          name="password"
          autoComplete="current-password"
          enterKeyHint="done"
          placeholder="••••••••"
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
          {submitting ? 'Entrando' : 'Entrar'}
        </Button>
      </form>
    </AuthLayout>
  )
}
