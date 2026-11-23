import { http } from './client'
import type {
  CaptureResponse,
  FamousCategory,
  FamousFilters,
  FamousResponse,
  JsonPatchOperation,
  TokenResponse,
  UserLoginRequest,
  UserPutUpdateRequest,
  UserRegisterRequest,
  UserResponseBasic,
  UserResponseFull,
} from './types'

const FAMOUS_CATEGORIES: FamousCategory[] = ['legendary', 'epic', 'rare', 'common']

/**
 * Endpoints tipados de `docs/openapi.json`. Cada funcion devuelve el cuerpo ya
 * desenvuelto; los errores quedan como `AxiosError` para que la UI los pase por
 * `toAppError`.
 */

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export const authApi = {
  async login(body: UserLoginRequest): Promise<TokenResponse> {
    const { data } = await http.post<TokenResponse>('/auth/login', body)
    return data
  },

  async register(body: UserRegisterRequest): Promise<TokenResponse> {
    const { data } = await http.post<TokenResponse>('/auth/register', body)
    return data
  },
}

export const usersApi = {
  async me(): Promise<UserResponseFull> {
    const { data } = await http.get<UserResponseFull>('/users/me')
    return data
  },

  async updateMe(body: UserPutUpdateRequest): Promise<UserResponseFull> {
    const { data } = await http.put<UserResponseFull>('/users/me', body)
    return data
  },

  async patchMe(operations: JsonPatchOperation[]): Promise<UserResponseFull> {
    const { data } = await http.patch<UserResponseFull>('/users/me', operations, {
      headers: { 'Content-Type': 'application/json-patch+json' },
    })
    return data
  },

  async remove(userId: string): Promise<void> {
    await http.delete(`/users/${userId}`)
  },

  async list(name?: string, signal?: AbortSignal): Promise<UserResponseBasic[]> {
    const { data } = await http.get<UserResponseBasic[]>('/users', {
      params: name?.trim() ? { name: name.trim() } : undefined,
      signal,
    })
    return data
  },

  async get(userId: string, signal?: AbortSignal): Promise<UserResponseBasic> {
    const { data } = await http.get<UserResponseBasic>(`/users/${userId}`, { signal })
    return data
  },

  async ranking(signal?: AbortSignal): Promise<UserResponseBasic[]> {
    const { data } = await http.get<UserResponseBasic[]>('/users/ranking', { signal })
    return data
  },

  async friends(userId: string, signal?: AbortSignal): Promise<UserResponseBasic[]> {
    const { data } = await http.get<UserResponseBasic[]>(`/users/${userId}/friends`, { signal })
    return data
  },

  async addFriend(userId: string, friendId: string): Promise<UserResponseBasic> {
    const { data } = await http.post<UserResponseBasic>(`/users/${userId}/friends`, { friendId })
    return data
  },

  async removeFriend(userId: string, friendId: string): Promise<void> {
    await http.delete(`/users/${userId}/friends/${friendId}`)
  },

  async friendProfile(userId: string, friendId: string, signal?: AbortSignal): Promise<UserResponseFull> {
    const { data } = await http.get<UserResponseFull>(`/users/${userId}/friends/${friendId}`, { signal })
    return data
  },
}

export const famousApi = {
  async list(filters: FamousFilters = {}, signal?: AbortSignal): Promise<FamousResponse[]> {
    const params: Record<string, string> = {}
    if (filters.type) params.type = filters.type
    if (filters.category) params.category = filters.category

    const { data } = await http.get<FamousResponse[]>('/famous', {
      params: Object.keys(params).length > 0 ? params : undefined,
      signal,
    })

    // El backend cachea `GET /famous` sin filtros bajo la clave "null-null". Si
    // esa entrada se genero antes de cargar el catalogo, queda una lista vacia
    // hasta que expire (5 min) y "Todas"/"Todos" no muestra ningun famoso.
    // Pedir por categoria esquiva esa clave; luego se unen y ordenan los cuatro
    // resultados. Con filtros activos la respuesta original ya es correcta.
    if (data.length > 0 || params.type || params.category) return data

    signal?.throwIfAborted()

    const byCategory = await Promise.all(
      FAMOUS_CATEGORIES.map((category) =>
        http.get<FamousResponse[]>('/famous', { params: { category }, signal }),
      ),
    )

    const byId = new Map<string, FamousResponse>()
    for (const response of byCategory) {
      for (const famous of response.data) byId.set(famous.famousId, famous)
    }

    return [...byId.values()].toSorted((a, b) => a.pokedexNumber - b.pokedexNumber)
  },

  async get(famousId: string, signal?: AbortSignal): Promise<FamousResponse> {
    const { data } = await http.get<FamousResponse>(`/famous/${famousId}`, { signal })
    return data
  },
}

export interface IdentifyPayload {
  ownerId: string
  famousName: string
  image: File | Blob
}

export const capturesApi = {
  /**
   * Multipart con `image` (archivo) y `name` (texto). El reconocimiento facial
   * puede tardar: se le da mas margen que al resto de la API.
   */
  async identify({ ownerId, famousName, image }: IdentifyPayload): Promise<CaptureResponse> {
    const form = new FormData()
    const filename = image instanceof File ? image.name : 'captura.png'
    form.append('image', image, filename)
    form.append('name', famousName)

    const { data } = await http.post<CaptureResponse>(`/captures/${ownerId}/identify`, form, {
      timeout: 60_000,
    })
    return data
  },

  async mine(signal?: AbortSignal): Promise<CaptureResponse[]> {
    const { data } = await http.get<CaptureResponse[]>('/captures/me', { signal })
    return data
  },
}

export { MAX_IMAGE_BYTES }
