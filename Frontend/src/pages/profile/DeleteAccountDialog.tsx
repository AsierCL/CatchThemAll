import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toAppError } from '../../api/errors'
import { usersApi } from '../../api/endpoints'
import type { UserResponse } from '../../api/types'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { PixelIcon } from '../../components/ui/PixelIcon'
import { useToast } from '../../components/ui/Toast'

interface DeleteAccountDialogProps {
  user: UserResponse
  open: boolean
  onClose: () => void
  onLogout: () => void
}

/**
 * Baja de cuenta (`DELETE /users/{userId}`). Exige escribir el nombre del
 * cazador para habilitar la confirmacion destructiva.
 */
export function DeleteAccountDialog({ user, open, onClose, onLogout }: DeleteAccountDialogProps) {
  const navigate = useNavigate()
  const toast = useToast()

  const [typedName, setTypedName] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const canConfirm = typedName === user.name && !deleting

  function handleClose() {
    if (deleting) return
    setTypedName('')
    setServerError(null)
    onClose()
  }

  async function handleDelete() {
    setDeleting(true)
    setServerError(null)

    try {
      await usersApi.remove(user.userId)
      toast.success('Cuenta eliminada', 'Tu cuenta de cazador fue eliminada.')
      onClose()
      onLogout()
      navigate('/')
    } catch (error) {
      const appError = toAppError(error)
      setServerError(`${appError.title}. ${appError.message}`)
      toast.error(appError.title, appError.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Eliminar cuenta"
      description="Esta acción es definitiva: se borran tu perfil, tus capturas y tu puntaje."
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={deleting}>
            Cancelar
          </Button>
          <Button variant="danger" size="sm" loading={deleting} disabled={!canConfirm} onClick={handleDelete}>
            Eliminar cuenta
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-ink-500">
          Para confirmar, escribí tu nombre de cazador:{' '}
          <span className="font-pixel text-ink-900">{user.name}</span>
        </p>

        <Input
          label="Nombre de cazador"
          autoComplete="off"
          value={typedName}
          onChange={(event) => {
            setTypedName(event.target.value)
            setServerError(null)
          }}
          placeholder={user.name}
          disabled={deleting}
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
      </div>
    </Modal>
  )
}
