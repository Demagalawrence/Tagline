import { UserProfile } from '../types'
import { apiRequest, clearToken, setToken } from './api'

export interface RegisterResult {
  user: UserProfile
  token: string
  /** Only present in non-production; mirrors the emailed token for local dev. */
  devVerificationToken?: string
}

export interface AuthService {
  login(email: string, password: string): Promise<{ user: UserProfile; token: string }>
  register(name: string, email: string, phone: string, password: string): Promise<RegisterResult>
  logout(): Promise<void>
  forgotPassword(email: string): Promise<{ sent: boolean; devResetToken?: string }>
  resetPassword(token: string, password: string): Promise<boolean>
  verifyEmail(token: string): Promise<boolean>
  resendVerification(email: string): Promise<{ sent: boolean; emailVerified: boolean }>
  me(): Promise<UserProfile>
}

export class ApiAuthService implements AuthService {
  async login(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const res = await apiRequest<{ user: UserProfile; token: string }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    await setToken(res.token)
    return res
  }

  async register(name: string, email: string, phone: string, password: string) {
    const res = await apiRequest<RegisterResult>('/api/auth/register', {
      method: 'POST',
      body: { name, email, phone, password },
    })
    await setToken(res.token)
    return res
  }

  async logout(): Promise<void> {
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

  async me(): Promise<UserProfile> {
    return apiRequest<UserProfile>('/api/auth/me', { auth: true })
  }
}

export const authService: AuthService = new ApiAuthService()
