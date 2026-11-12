import { http } from './client'
import type {
  CaptureResponse,
  FamousFilters,
  FamousResponse,
  JsonPatchOperation,
  TokenResponse,
  UserLoginRequest,
  UserPutUpdateRequest,
  UserRegisterRequest,
  UserResponse,
} from './types'

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
  async me(): Promise<UserResponse> {
    const { data } = await http.get<UserResponse>('/users/me')
    return data
  },

  async updateMe(body: UserPutUpdateRequest): Promise<UserResponse> {
    const { data } = await http.put<UserResponse>('/users/me', body)
    return data
  },

  async patchMe(operations: JsonPatchOperation[]): Promise<UserResponse> {
    const { data } = await http.patch<UserResponse>('/users/me', operations, {
      headers: { 'Content-Type': 'application/json-patch+json' },
    })
    return data
  },

  async remove(userId: string): Promise<void> {
    await http.delete(`/users/${userId}`)
  },

  async list(name?: string): Promise<UserResponse[]> {
    const { data } = await http.get<UserResponse[]>('/users', {
      params: name?.trim() ? { name: name.trim() } : undefined,
    })
    return data
  },

  async get(userId: string): Promise<UserResponse> {
    const { data } = await http.get<UserResponse>(`/users/${userId}`)
    return data
  },

  async getFull(userId: string): Promise<UserResponse> {
    const { data } = await http.get<UserResponse>(`/users/${userId}/full`)
    return data
  },

  async ranking(): Promise<UserResponse[]> {
    const { data } = await http.get<UserResponse[]>('/users/ranking')
    return data
  },

  async friends(userId: string): Promise<UserResponse[]> {
    const { data } = await http.get<UserResponse[]>(`/users/${userId}/friends`)
    return data
  },

  async addFriend(userId: string, friendId: string): Promise<UserResponse> {
    const { data } = await http.post<UserResponse>(`/users/${userId}/friends`, { friendId })
    return data
  },

  async removeFriend(userId: string, friendId: string): Promise<void> {
    await http.delete(`/users/${userId}/friends/${friendId}`)
  },

  async friendProfile(userId: string, friendId: string): Promise<UserResponse> {
    const { data } = await http.get<UserResponse>(`/users/${userId}/friends/${friendId}`)
    return data
  },
}

export const famousApi = {
  async list(filters: FamousFilters = {}): Promise<FamousResponse[]> {
    const params: Record<string, string> = {}
    if (filters.type) params.type = filters.type
    if (filters.category) params.category = filters.category

    const { data } = await http.get<FamousResponse[]>('/famous', {
      params: Object.keys(params).length > 0 ? params : undefined,
    })
    return data
  },

  async get(famousId: string): Promise<FamousResponse> {
    const { data } = await http.get<FamousResponse>(`/famous/${famousId}`)
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

  async mine(): Promise<CaptureResponse[]> {
    const { data } = await http.get<CaptureResponse[]>('/captures/me')
    return data
  },

  async mineById(captureId: string): Promise<CaptureResponse> {
    const { data } = await http.get<CaptureResponse>(`/captures/me/${captureId}`)
    return data
  },
}

export { MAX_IMAGE_BYTES }
