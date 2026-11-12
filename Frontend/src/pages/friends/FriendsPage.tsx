import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toAppError } from '../../api/errors'
import type { AppError } from '../../api/errors'
import { usersApi } from '../../api/endpoints'
import type { UserResponse } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'
import { EmptyState, ErrorState, LoadingBlock } from '../../components/ui/Feedback'
import { ConfirmDialog } from '../../components/ui/Modal'
import { Panel, SectionHeading } from '../../components/ui/Panel'
import { PixelIcon } from '../../components/ui/PixelIcon'
import { useToast } from '../../components/ui/Toast'
import { formatNumber } from '../../lib/format'
import { useAsync } from '../../lib/useAsync'

const SEARCH_MIN_CHARS = 2
const SEARCH_DEBOUNCE_MS = 300

export function FriendsPage() {
  const { status, user } = useAuth()
  const toast = useToast()

  const friends = useAsync(() => {
    if (!user) return Promise.resolve<UserResponse[]>([])
    return usersApi.friends(user.userId)
  }, [user?.userId])

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserResponse[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<AppError | null>(null)
  const [searchNonce, setSearchNonce] = useState(0)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [removing, setRemoving] = useState<UserResponse | null>(null)
  const [removingLoading, setRemovingLoading] = useState(false)

  const friendIds = useMemo(() => new Set((friends.data ?? []).map((friend) => friend.userId)), [friends.data])

  const visibleResults = useMemo(
    () => results.filter((result) => result.userId !== user?.userId && !friendIds.has(result.userId)),
    [results, user?.userId, friendIds],
  )

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < SEARCH_MIN_CHARS) {
      setResults([])
      setSearchError(null)
      setSearching(false)
      return
    }

    let active = true
    setSearching(true)
    setSearchError(null)

    const timer = window.setTimeout(async () => {
      try {
        const found = await usersApi.list(trimmed)
        if (active) setResults(found)
      } catch (error) {
        if (active) setSearchError(toAppError(error))
      } finally {
        if (active) setSearching(false)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [query, searchNonce])

  if (status !== 'authenticated' || !user) return null

  // Captura el usuario ya acotado a no-null para los handlers (las funciones
  // declaradas se elevan y no heredan el estrechamiento del guard anterior).
  const currentUser = user

  async function handleAdd(friend: UserResponse) {
    setAddingId(friend.userId)
    try {
      const added = await usersApi.addFriend(currentUser.userId, friend.userId)
      friends.setData((current) => {
        const list = current ?? []
        if (list.some((entry) => entry.userId === added.userId)) return list
        return [...list, added]
      })
      toast.success('Amistad creada', `${added.name} ya está en tu lista de amigos.`)
    } catch (error) {
      toast.error('No se pudo agregar', toAppError(error).message)
    } finally {
      setAddingId(null)
    }
  }

  async function handleConfirmRemove() {
    if (!removing) return
    setRemovingLoading(true)
    try {
      await usersApi.removeFriend(currentUser.userId, removing.userId)
      friends.setData((current) => (current ?? []).filter((entry) => entry.userId !== removing.userId))
      toast.success('Amistad eliminada', `Ya no sos amigo de ${removing.name}.`)
    } catch (error) {
      toast.error('No se pudo quitar', toAppError(error).message)
    } finally {
      setRemovingLoading(false)
      setRemoving(null)
    }
  }

  const trimmedQuery = query.trim()

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="label-pixel">Red de cazadores</p>
        <h1 className="font-pixel text-lg text-ink-900 sm:text-2xl">Amigos</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-ink-500">
          Seguí a otros cazadores, mirá sus perfiles y armá tu propia red.
        </p>
      </header>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Tu lista"
          title="Tus amigos"
          description="Las amistades son recíprocas: si alguien te agrega, aparece acá."
        />
        <div aria-live="polite">{renderFriends()}</div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Buscar"
          title="Encontrar cazadores"
          description="Buscá por nombre para agregar nuevos amigos."
        />
        <Panel>
          <Input
            label="Buscar cazador"
            placeholder="Escribí al menos 2 caracteres"
            hint={`Mínimo ${SEARCH_MIN_CHARS} caracteres`}
            type="search"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="mt-4" aria-live="polite">
            {renderSearch()}
          </div>
        </Panel>
      </section>

      <ConfirmDialog
        open={removing !== null}
        title="¿Quitar amigo?"
        description={
          removing
            ? `Se va a eliminar la amistad con ${removing.name}. Podés volver a agregarlo cuando quieras.`
            : undefined
        }
        confirmLabel="Quitar"
        cancelLabel="Cancelar"
        destructive
        loading={removingLoading}
        onConfirm={handleConfirmRemove}
        onClose={() => {
          if (!removingLoading) setRemoving(null)
        }}
      />
    </div>
  )

  function renderFriends() {
    if (friends.loading) return <LoadingBlock label="Cargando amigos" />
    if (friends.error) return <ErrorState error={friends.error} onRetry={friends.reload} />

    const list = friends.data ?? []
    if (list.length === 0) {
      return (
        <EmptyState
          icon="users"
          title="Todavía no tenés amigos"
          description="Buscá cazadores por nombre para agregarlos y armar tu red."
        />
      )
    }

    return (
      <Panel padded={false}>
        <ul aria-label="Lista de amigos">
          {list.map((friend) => (
            <FriendRow key={friend.userId} friend={friend} onRemove={() => setRemoving(friend)} />
          ))}
        </ul>
      </Panel>
    )
  }

  function renderSearch() {
    if (searchError) return <ErrorState error={searchError} onRetry={() => setSearchNonce((value) => value + 1)} />
    if (searching) return <LoadingBlock label="Buscando cazadores" />

    if (trimmedQuery.length < SEARCH_MIN_CHARS) {
      return <p className="text-sm text-ink-400">Escribí el nombre para ver resultados.</p>
    }

    if (visibleResults.length === 0) {
      return (
        <EmptyState
          icon="search"
          title="Sin resultados"
          description="No encontramos cazadores con ese nombre. Probá con otra búsqueda."
        />
      )
    }

    return (
      <ul aria-label="Resultados de búsqueda" className="border-2 border-paper-200">
        {visibleResults.map((result) => (
          <SearchResultRow
            key={result.userId}
            result={result}
            adding={addingId === result.userId}
            onAdd={() => handleAdd(result)}
          />
        ))}
      </ul>
    )
  }
}

interface FriendRowProps {
  friend: UserResponse
  onRemove: () => void
}

function FriendRow({ friend, onRemove }: FriendRowProps) {
  return (
    <li className="flex items-center gap-3 border-b-2 border-paper-200 px-4 py-3 last:border-b-0">
      <Link
        to={`/usuarios/${friend.userId}`}
        className="flex min-w-0 flex-1 items-center gap-3 transition-colors hover:text-poke-400"
      >
        <Avatar name={friend.name} photoUrl={friend.photoUrl} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-pixel text-xs text-ink-900">{friend.name}</p>
          <p className="text-xs text-ink-500">
            {formatNumber(friend.score)} pts · {formatNumber(friend.captureCount)} capturas
          </p>
        </div>
      </Link>
      <Button variant="danger" size="sm" onClick={onRemove} icon={<PixelIcon name="close" size={12} />}>
        Quitar
      </Button>
    </li>
  )
}

interface SearchResultRowProps {
  result: UserResponse
  adding: boolean
  onAdd: () => void
}

function SearchResultRow({ result, adding, onAdd }: SearchResultRowProps) {
  return (
    <li className="flex items-center gap-3 border-b-2 border-paper-200 px-3 py-2.5 last:border-b-0">
      <Link
        to={`/usuarios/${result.userId}`}
        className="flex min-w-0 flex-1 items-center gap-3 transition-colors hover:text-poke-400"
      >
        <Avatar name={result.name} photoUrl={result.photoUrl} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-pixel text-xs text-ink-900">{result.name}</p>
          <p className="text-xs text-ink-500">{formatNumber(result.score)} pts</p>
        </div>
      </Link>
      <Button size="sm" loading={adding} onClick={onAdd} icon={<PixelIcon name="user" size={12} />}>
        {adding ? 'Agregando' : 'Agregar'}
      </Button>
    </li>
  )
}
