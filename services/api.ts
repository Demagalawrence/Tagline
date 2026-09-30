import { API_BASE_URL, STORAGE_KEYS } from '@/constants'
import * as storage from '@/utils/storage'

const TOKEN_KEY = STORAGE_KEYS.token

export class ApiError extends Error {
  readonly status: number
  readonly details: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }

  /** True when the request never reached the server. */
  get isNetworkError(): boolean {
    return this.status === 0
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }
}

export async function getToken(): Promise<string | null> {
  return storage.getItem<string>(TOKEN_KEY)
}

export async function setToken(token: string): Promise<void> {
  await storage.setItem(TOKEN_KEY, token)
}

export async function clearToken(): Promise<void> {
  await storage.removeItem(TOKEN_KEY)
}

type UnauthorizedHandler = () => void

const unauthorizedHandlers = new Set<UnauthorizedHandler>()

/**
 * Register a callback to run when the session is unrecoverable. The API layer
 * cannot import the auth store directly (that would be a cycle through the
 * services), so the store registers itself here instead.
 */
export function onUnauthorized(handler: UnauthorizedHandler): () => void {
  unauthorizedHandlers.add(handler)
  return () => unauthorizedHandlers.delete(handler)
}

function notifyUnauthorized(): void {
  for (const handler of unauthorizedHandlers) handler()
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export interface RequestOptions {
  method?: Method
  body?: unknown
  auth?: boolean
  /** Internal: prevents the refresh call itself from recursing. */
  _isRetry?: boolean
}

/**
 * A single in-flight refresh shared by every concurrent 401. Without this, five
 * screens mounting at once would each spend a refresh token and race, leaving
 * only the last one valid.
 */
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const token = await getToken()
      if (!token) return null
      const res = await apiRequest<{ token: string }>('/api/auth/refresh', {
        method: 'POST',
        auth: true,
        _isRetry: true,
      })
      if (!res?.token) return null
      await setToken(res.token)
      return res.token
    } catch {
      return null
    } finally {
      // Allow the next 401 to start a fresh refresh.
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = false, _isRetry = false } = options

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const token = await getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Network request failed. Check your connection.')
  }

  const text = await response.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (response.status === 401 && auth && !_isRetry) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      // Retry once with the fresh token.
      return apiRequest<T>(path, { method, body, auth, _isRetry: true })
    }
    await clearToken()
    notifyUnauthorized()
  }

  if (!response.ok) {
    const message = extractMessage(data) ?? `Request failed (${response.status})`
    throw new ApiError(response.status, message, data)
  }

  return data as T
}

/** Nest validation errors arrive as `message: string[]`. */
function extractMessage(data: unknown): string | null {
  if (typeof data !== 'object' || data === null || !('message' in data)) return null
  const message = (data as { message: unknown }).message
  if (typeof message === 'string') return message
  if (Array.isArray(message)) {
    const parts = message.filter((m): m is string => typeof m === 'string')
    if (parts.length) return parts.join('\n')
  }
  return null
}
