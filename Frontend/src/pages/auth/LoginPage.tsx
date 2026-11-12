import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toAppError } from '../../api/errors'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'
import { PixelIcon } from '../../components/ui/PixelIcon'
import { useToast } from '../../components/ui/Toast'
import { validateName, validatePassword, type FieldErrors } from '../../lib/validation'
import { AuthLayout } from './AuthLayout'

interface LocationState {
  from?: string
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const [form, setForm] = useState({ name: '', password: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as LocationState | null)?.from ?? '/pokedex'

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setServerError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: FieldErrors = {
      name: validateName(form.name) ?? '',
      password: validatePassword(form.password) ?? '',
    }
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

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
          autoComplete="username"
          autoFocus
          placeholder="ada"
          value={form.name}
          onChange={(event) => update('name', event.target.value)}
          error={errors.name || undefined}
          maxLength={64}
          required
        />

        <Input
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          onChange={(event) => update('password', event.target.value)}
          error={errors.password || undefined}
          maxLength={72}
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
