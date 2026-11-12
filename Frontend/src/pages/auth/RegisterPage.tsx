import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toAppError } from '../../api/errors'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'
import { PixelIcon } from '../../components/ui/PixelIcon'
import { useToast } from '../../components/ui/Toast'
import {
  validateBirthDate,
  validateEmail,
  validateName,
  validatePassword,
  type FieldErrors,
} from '../../lib/validation'
import { AuthLayout } from './AuthLayout'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState({ name: '', email: '', password: '', birthDate: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setServerError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: FieldErrors = {
      name: validateName(form.name) ?? '',
      email: validateEmail(form.email) ?? '',
      password: validatePassword(form.password) ?? '',
      birthDate: validateBirthDate(form.birthDate) ?? '',
    }
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

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
            label="Fecha de nacimiento"
            type="date"
            max={today}
            autoComplete="bday"
            value={form.birthDate}
            onChange={(event) => update('birthDate', event.target.value)}
            error={errors.birthDate || undefined}
            required
          />
        </div>

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="ada@example.com"
          value={form.email}
          onChange={(event) => update('email', event.target.value)}
          error={errors.email || undefined}
          maxLength={255}
          required
        />

        <Input
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          hint="8 a 72 caracteres"
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
          {submitting ? 'Creando cuenta' : 'Crear cuenta'}
        </Button>

        <p className="text-[0.6875rem] leading-relaxed text-ink-400">
          Al crear la cuenta aceptás que guardemos tu perfil, tus capturas y el puntaje para el ranking.
        </p>
      </form>
    </AuthLayout>
  )
}
