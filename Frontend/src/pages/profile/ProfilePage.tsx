import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { SectionHeading } from '../../components/ui/Panel'
import { PixelIcon, type IconName } from '../../components/ui/PixelIcon'
import { formatNumber } from '../../lib/format'
import { DeleteAccountDialog } from './DeleteAccountDialog'
import { EditProfileModal } from './EditProfileModal'

interface StatCardProps {
  label: string
  value: number
  icon: IconName
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="border-2 border-paper-300 bg-paper-0 p-4 shadow-pixel-sm">
      <dt className="label-pixel">{label}</dt>
      <dd className="mt-1.5 flex items-center gap-2 font-pixel text-lg text-ink-900">
        <PixelIcon name={icon} size={14} className="text-ink-400" />
        {formatNumber(value)}
      </dd>
    </div>
  )
}

export function ProfilePage() {
  const { status, user, setUser, logout } = useAuth()
  const [editing, setEditing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (status !== 'authenticated' || !user) return null

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <Avatar name={user.name} photoUrl={user.photoUrl} size="lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="label-pixel">Mi perfil</p>
          <h1 className="font-pixel text-xl leading-tight text-ink-900 sm:text-2xl">{user.name}</h1>
          {user.description ? (
            <p className="max-w-2xl text-sm leading-relaxed text-ink-500">{user.description}</p>
          ) : (
            <p className="text-sm text-ink-400">Todavía no escribiste una descripción.</p>
          )}
        </div>
      </section>

      <section aria-label="Estadísticas del perfil">
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Puntaje" value={user.score} icon="spark" />
          <StatCard label="Capturas" value={user.captureCount} icon="camera" />
          <StatCard label="Amigos" value={user.friendIds.length} icon="users" />
        </dl>
      </section>

      <section aria-label="Acciones del perfil" className="flex flex-wrap gap-2">
        <Link to="/mi-pokedex">
          <Button variant="secondary" icon={<PixelIcon name="ball" size={14} />}>
            Mi Pokédex
          </Button>
        </Link>
        <Link to="/amigos">
          <Button variant="secondary" icon={<PixelIcon name="users" size={14} />}>
            Mis amigos
          </Button>
        </Link>
        <Button variant="primary" icon={<PixelIcon name="user" size={14} />} onClick={() => setEditing(true)}>
          Editar perfil
        </Button>
      </section>

      <section className="border-2 border-rose-400/40 bg-paper-100 p-4 shadow-pixel sm:p-5">
        <SectionHeading
          title="Zona peligrosa"
          description="Eliminar tu cuenta borra tu perfil, tus capturas y tu puntaje para siempre. Esta acción no se puede deshacer."
          action={
            <Button variant="danger" icon={<PixelIcon name="warning" size={14} />} onClick={() => setDeleteOpen(true)}>
              Eliminar cuenta
            </Button>
          }
        />
      </section>

      <EditProfileModal user={user} open={editing} onClose={() => setEditing(false)} onSaved={setUser} />
      <DeleteAccountDialog
        user={user}
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onLogout={logout}
      />
    </div>
  )
}
