import { UserProfile } from '../types'
import { apiRequest, clearToken, setToken } from './api'
import { DEVICE_LABEL } from '@/constants'

export interface RegisterResult {
  user: UserProfile
  token: string
  /** Only present in non-production; mirrors the emailed token for local dev. */
  devVerificationToken?: string
}

export interface AuthSession {
  id: string
  deviceLabel: string
  userAgent?: string
  ipAddress?: string
  createdAt: string
  lastUsedAt?: string
  expiresAt: string
  revokedAt?: string
  isCurrent: boolean
  isActive: boolean
}

export interface MagicLinkResult {
  sent: boolean
  /** Only present in non-production; mirrors the emailed code for local dev. */
  devLoginToken?: string
  devLoginCode?: string
}

export interface AuthService {
  login(email: string, password: string): Promise<{ user: UserProfile; token: string }>
  register(name: string, email: string, phone: string, password: string): Promise<RegisterResult>
  logout(): Promise<void>
  forgotPassword(email: string): Promise<{ sent: boolean; devResetToken?: string }>
  resetPassword(token: string, password: string): Promise<boolean>
  verifyEmail(token: string): Promise<boolean>
  resendVerification(email: string): Promise<{ sent: boolean; emailVerified: boolean }>
  requestMagicLink(email: string): Promise<MagicLinkResult>
  verifyMagicLink(token: string): Promise<{ user: UserProfile; token: string }>
  verifyLoginCode(email: string, code: string): Promise<{ user: UserProfile; token: string }>
  me(): Promise<UserProfile>
  listSessions(): Promise<AuthSession[]>
  revokeSession(id: string): Promise<void>
  revokeOtherSessions(): Promise<number>
}

export class ApiAuthService implements AuthService {
  async login(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const res = await apiRequest<{ user: UserProfile; token: string }>('/api/auth/login', {
      method: 'POST',
      body: { email, password, deviceLabel: DEVICE_LABEL },
    })
    await setToken(res.token)
    return res
  }

  async register(name: string, email: string, phone: string, password: string) {
    const res = await apiRequest<RegisterResult>('/api/auth/register', {
      method: 'POST',
      body: { name, email, phone, password, deviceLabel: DEVICE_LABEL },
    })
    await setToken(res.token)
    return res
  }

  async logout(): Promise<void> {
    // Tell the server first so the session row is revoked, then drop the local
    // token regardless: a failed call must not leave a usable token on disk.
    try {
      await apiRequest<{ loggedOut: boolean }>('/api/auth/logout', { method: 'POST', auth: true })
    } catch {
      // Best effort; the local token is cleared below either way.
    }
    await clearToken()
  }

  async forgotPassword(email: string) {
    const res = await apiRequest<{ sent: boolean; devResetToken?: string }>(
      '/api/auth/forgot-password',
      { method: 'POST', body: { email } },
    )
    return res
  }

  async resetPassword(token: string, password: string): Promise<boolean> {
    const res = await apiRequest<{ reset: boolean }>('/api/auth/reset-password', {
      method: 'POST',
      body: { token, password },
    })
    return res.reset
  }

  async verifyEmail(token: string): Promise<boolean> {
    const res = await apiRequest<{ verified: boolean }>('/api/auth/verify-email', {
      method: 'POST',
      body: { token },
    })
    return res.verified
  }

  async resendVerification(email: string) {
    return apiRequest<{ sent: boolean; emailVerified: boolean }>('/api/auth/resend-verification', {
      method: 'POST',
      body: { email },
    })
  }

  async requestMagicLink(email: string): Promise<MagicLinkResult> {
    return apiRequest<MagicLinkResult>('/api/auth/magic-link', {
      method: 'POST',
      body: { email, deviceLabel: DEVICE_LABEL },
    })
  }

  async verifyMagicLink(token: string) {
    const res = await apiRequest<{ user: UserProfile; token: string }>(
      '/api/auth/magic-link/verify',
      { method: 'POST', body: { token, deviceLabel: DEVICE_LABEL } },
    )
    await setToken(res.token)
    return res
  }

  async verifyLoginCode(email: string, code: string) {
    const res = await apiRequest<{ user: UserProfile; token: string }>('/api/auth/code/verify', {
      method: 'POST',
      body: { email, code, deviceLabel: DEVICE_LABEL },
    })
    await setToken(res.token)
    return res
  }

  async me(): Promise<UserProfile> {
    return apiRequest<UserProfile>('/api/auth/me', { auth: true })
  }
  async listSessions(): Promise<AuthSession[]> {
    return apiRequest<AuthSession[]>('/api/auth/sessions', { auth: true })
  }

  async revokeSession(id: string): Promise<void> {
    await apiRequest(`/api/auth/sessions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      auth: true,
    })
  }

  async revokeOtherSessions(): Promise<number> {
    const res = await apiRequest<{ revoked: number }>('/api/auth/sessions/revoke-others', {
      method: 'POST',
      auth: true,
    })
    return res.revoked
  }
}

export const authService: AuthService = new ApiAuthService()
