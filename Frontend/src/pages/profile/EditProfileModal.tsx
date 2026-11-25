import { useEffect, useRef, useState, type FormEvent } from 'react'
import { toAppError } from '../../api/errors'
import { usersApi } from '../../api/endpoints'
import type { JsonPatchOperation, UserResponseFull } from '../../api/types'
import { Button } from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Field'
import { ConfirmDialog, Modal } from '../../components/ui/Modal'
import { PixelIcon } from '../../components/ui/PixelIcon'
import { useToast } from '../../components/ui/Toast'
import { announce } from '../../lib/announce'
import { validateDescription, validateName, validatePhotoUrl, type FieldErrors } from '../../lib/validation'

interface EditProfileForm {
  name: string
  description: string
  photoUrl: string
}

const FIELD_ORDER = ['name', 'description', 'photoUrl'] as const
type EditProfileField = (typeof FIELD_ORDER)[number]

type RemoveTarget = 'photo' | 'description'

interface EditProfileModalProps {
  user: UserResponseFull
  open: boolean
  onClose: () => void
  onSaved: (user: UserResponseFull) => void
}

/**
 * Edicion del perfil propio. Guarda con `PUT /users/me` y deja quitar foto o
 * descripcion por separado con `PATCH /users/me` (JSON Patch).
 */
export function EditProfileModal({ user, open, onClose, onSaved }: EditProfileModalProps) {
  const toast = useToast()

  const [form, setForm] = useState<EditProfileForm>({
    name: user.name,
    description: user.description ?? '',
    photoUrl: user.photoUrl ?? '',
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<RemoveTarget | null>(null)
  const [removing, setRemoving] = useState(false)
  const dirty = useRef(new Set<EditProfileField>())

  // Syncs the form with the profile each time the dialog opens (or after a
  // successful save updates the `user` object).
  useEffect(() => {
    if (!open) return
    setForm({
      name: user.name,
      description: user.description ?? '',
      photoUrl: user.photoUrl ?? '',
    })
    setErrors({})
    setServerError(null)
    setRemoveTarget(null)
    dirty.current.clear()
  }, [open, user])

  function update(field: keyof EditProfileForm, value: string) {
    dirty.current.add(field)
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setServerError(null)
  }

  function validateField(field: EditProfileField, value: string): string {
    switch (field) {
      case 'name':
        return validateName(value) ?? ''
      case 'description':
        return validateDescription(value) ?? ''
      case 'photoUrl':
        return validatePhotoUrl(value) ?? ''
    }
    return ''
  }

  function handleBlur(field: EditProfileField) {
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
      description: validateField('description', form.description),
      photoUrl: validateField('photoUrl', form.photoUrl),
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
      const updated = await usersApi.updateMe({
        name: form.name.trim(),
        description: form.description.trim(),
        photoUrl: form.photoUrl.trim(),
      })
      onSaved(updated)
      onClose()
      toast.success('Perfil actualizado', 'Los cambios quedaron guardados.')
    } catch (error) {
      const appError = toAppError(error)
      setServerError(`${appError.title}. ${appError.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemoveField() {
    if (!removeTarget) return

    const operations: JsonPatchOperation[] =
      removeTarget === 'photo'
        ? [{ op: 'replace', path: '/photoUrl', value: '' }]
        : [{ op: 'replace', path: '/description', value: '' }]

    setRemoving(true)
    setServerError(null)

    try {
      const updated = await usersApi.patchMe(operations)
      onSaved(updated)
      setRemoveTarget(null)
    } catch (error) {
      const appError = toAppError(error)
      setServerError(`${appError.title}. ${appError.message}`)
      setRemoveTarget(null)
    } finally {
      setRemoving(false)
    }
  }

  const canRemovePhoto = Boolean(user.photoUrl)
  const canRemoveDescription = Boolean(user.description)

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Editar perfil"
        description="Actualizá tu nombre, foto y descripción de cazador."
        size="md"
        preventClose={submitting || removing}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting || removing}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="edit-profile-form"
              size="sm"
              loading={submitting}
              disabled={removing}
            >
              Guardar
            </Button>
          </>
        }
      >
        <form id="edit-profile-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Nombre de cazador"
            name="name"
            autoComplete="username"
            data-autofocus
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            onBlur={() => handleBlur('name')}
            error={errors.name || undefined}
            maxLength={64}
            required
          />

          <Textarea
            label="Descripción"
            name="description"
            hint="Hasta 255 caracteres"
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            onBlur={() => handleBlur('description')}
            error={errors.description || undefined}
            maxLength={255}
          />

          <Input
            label="Foto (URL)"
            name="photoUrl"
            type="url"
            autoComplete="url"
            placeholder="https://example.com/foto.jpg"
            hint="URL http o https"
            value={form.photoUrl}
            onChange={(event) => update('photoUrl', event.target.value)}
            onBlur={() => handleBlur('photoUrl')}
            error={errors.photoUrl || undefined}
            maxLength={512}
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
        </form>

        {(canRemovePhoto || canRemoveDescription) && (
          <div className="mt-4 flex flex-wrap gap-2 border-t-2 border-paper-200 pt-4">
            {canRemovePhoto && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRemoveTarget('photo')}
                disabled={submitting || removing}
              >
                Quitar foto
              </Button>
            )}
            {canRemoveDescription && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRemoveTarget('description')}
                disabled={submitting || removing}
              >
                Quitar descripción
              </Button>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={removeTarget === 'photo'}
        title="Quitar foto"
        description="Se va a quitar la foto de tu perfil. Podés volver a cargarla cuando quieras."
        confirmLabel="Quitar foto"
        loading={removing}
        onConfirm={handleRemoveField}
        onClose={() => setRemoveTarget(null)}
      />

      <ConfirmDialog
        open={removeTarget === 'description'}
        title="Quitar descripción"
        description="Se va a quitar la descripción de tu perfil."
        confirmLabel="Quitar descripción"
        loading={removing}
        onConfirm={handleRemoveField}
        onClose={() => setRemoveTarget(null)}
      />
    </>
  )
}
