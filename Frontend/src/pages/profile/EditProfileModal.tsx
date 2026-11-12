import { useEffect, useState, type FormEvent } from 'react'
import { toAppError } from '../../api/errors'
import { usersApi } from '../../api/endpoints'
import type { JsonPatchOperation, UserResponse } from '../../api/types'
import { Button } from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Field'
import { ConfirmDialog, Modal } from '../../components/ui/Modal'
import { PixelIcon } from '../../components/ui/PixelIcon'
import { useToast } from '../../components/ui/Toast'
import { validateDescription, validateName, validatePhotoUrl, type FieldErrors } from '../../lib/validation'

interface EditProfileForm {
  name: string
  description: string
  photoUrl: string
}

type RemoveTarget = 'photo' | 'description'

interface EditProfileModalProps {
  user: UserResponse
  open: boolean
  onClose: () => void
  onSaved: (user: UserResponse) => void
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
  }, [open, user])

  function update(field: keyof EditProfileForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setServerError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: FieldErrors = {
      name: validateName(form.name) ?? '',
      description: validateDescription(form.description) ?? '',
      photoUrl: validatePhotoUrl(form.photoUrl) ?? '',
    }
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    setSubmitting(true)
    setServerError(null)

    try {
      const updated = await usersApi.updateMe({
        name: form.name.trim(),
        description: form.description,
        photoUrl: form.photoUrl.trim(),
      })
      onSaved(updated)
      toast.success('Perfil actualizado', 'Los cambios quedaron guardados.')
      onClose()
    } catch (error) {
      const appError = toAppError(error)
      setServerError(`${appError.title}. ${appError.message}`)
      toast.error(appError.title, appError.message)
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
      toast.success(removeTarget === 'photo' ? 'Foto quitada' : 'Descripción quitada')
      setRemoveTarget(null)
    } catch (error) {
      const appError = toAppError(error)
      setServerError(`${appError.title}. ${appError.message}`)
      toast.error(appError.title, appError.message)
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
            autoComplete="username"
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            error={errors.name || undefined}
            maxLength={64}
            required
          />

          <Textarea
            label="Descripción"
            hint="Hasta 255 caracteres"
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            error={errors.description || undefined}
            maxLength={255}
          />

          <Input
            label="Foto (URL)"
            type="url"
            placeholder="https://example.com/foto.jpg"
            hint="URL http o https"
            value={form.photoUrl}
            onChange={(event) => update('photoUrl', event.target.value)}
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
