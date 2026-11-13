import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toAppError } from '../../api/errors'
import { usersApi } from '../../api/endpoints'
import type { UserResponse } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ErrorState, LoadingBlock } from '../../components/ui/Feedback'
import { Panel } from '../../components/ui/Panel'
import { PixelIcon } from '../../components/ui/PixelIcon'
import { useToast } from '../../components/ui/Toast'
import { formatNumber } from '../../lib/format'
import { useAsync } from '../../lib/useAsync'

interface ProfileResult {
  profile: UserResponse
  isFriend: boolean
}

export function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const { user: me } = useAuth()
  const toast = useToast()
  const [adding, setAdding] = useState(false)

  const result = useAsync(() => loadProfile(userId, me), [userId, me?.userId])

  if (result.loading) {
    return (
      <div aria-live="polite" aria-busy="true">
        <LoadingBlock label="Cargando perfil" />
      </div>
    )
  }

  if (result.error) {
    return <ErrorState error={result.error} onRetry={result.reload} />
  }

  if (!result.data) {
    return <LoadingBlock label="Cargando perfil" />
  }

  const { profile, isFriend } = result.data
  const isOwnProfile = me?.userId === profile.userId

  async function handleAddFriend() {
    if (!me) return
    setAdding(true)
    try {
      const added = await usersApi.addFriend(me.userId, profile.userId)
      result.setData((current) => (current ? { profile: added, isFriend: true } : current))
      toast.success('Amistad creada', `Ahora sos amigo de ${added.name}.`)
    } catch (error) {
      toast.error('No se pudo agregar', toAppError(error).message)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-6">
      <p className="label-pixel">Perfil de cazador</p>

      <Panel elevation="raised">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <Avatar name={profile.name} photoUrl={profile.photoUrl} size="lg" className="mx-auto sm:mx-0" />

          <div className="min-w-0 flex-1 space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-pixel text-lg text-ink-900 sm:text-xl">{profile.name}</h1>
                {isFriend && <Badge tone="brand">Ya son amigos</Badge>}
              </div>
              {profile.description && (
                <p className="max-w-2xl text-sm leading-relaxed text-ink-700">{profile.description}</p>
              )}
            </div>

            <dl className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="border-2 border-paper-300 bg-paper-100/60 p-2.5 sm:p-3">
                <dt className="label-pixel">Puntaje</dt>
                <dd className="mt-1 font-pixel text-sm text-amber-400">{formatNumber(profile.score)}</dd>
              </div>
              <div className="border-2 border-paper-300 bg-paper-100/60 p-2.5 sm:p-3">
                <dt className="label-pixel">Capturas</dt>
                <dd className="mt-1 font-pixel text-sm text-ink-900">{formatNumber(profile.captureCount)}</dd>
              </div>
              <div className="border-2 border-paper-300 bg-paper-100/60 p-2.5 sm:p-3">
                <dt className="label-pixel">Amigos</dt>
                <dd className="mt-1 font-pixel text-sm text-ink-900">{formatNumber(profile.friendIds.length)}</dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center gap-2">
              {isOwnProfile ? (
                <Link to="/perfil" className="block max-sm:w-full">
                  <Button variant="secondary" size="sm" icon={<PixelIcon name="user" size={12} />} className="max-sm:w-full">
                    Ver mi perfil
                  </Button>
                </Link>
              ) : me && !isFriend ? (
                <Button
                  size="sm"
                  loading={adding}
                  onClick={handleAddFriend}
                  icon={<PixelIcon name="user" size={12} />}
                  className="max-sm:w-full"
                >
                  {adding ? 'Agregando' : 'Agregar amigo'}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  )
}

async function loadProfile(userId: string | undefined, me: UserResponse | null): Promise<ProfileResult> {
  if (!userId) throw new Error('Falta el identificador del usuario.')

  if (me) {
    try {
      // Vista completa solo si la amistad existe; en otro caso devuelve 404.
      const profile = await usersApi.friendProfile(me.userId, userId)
      return { profile, isFriend: true }
    } catch (error) {
      if (toAppError(error).status === 404) {
        const profile = await usersApi.get(userId)
        return { profile, isFriend: false }
      }
      throw error
    }
  }

  const profile = await usersApi.get(userId)
  return { profile, isFriend: false }
}
