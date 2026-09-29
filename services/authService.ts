import { UserProfile } from '../types'
import { apiRequest, clearToken, setToken } from './api'

export interface AuthService {
  login(email: string, password: string): Promise<{ user: UserProfile; token: string }>
  register(
    name: string,
    email: string,
    phone: string,
    password: string,
  ): Promise<{ user: UserProfile; token: string }>
  logout(): Promise<void>
  forgotPassword(email: string): Promise<boolean>
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
    const res = await apiRequest<{ user: UserProfile; token: string }>('/api/auth/register', {
      method: 'POST',
      body: { name, email, phone, password },
    })
    await setToken(res.token)
    return res
  }

  async logout(): Promise<void> {
    await clearToken()
  }

  async forgotPassword(email: string): Promise<boolean> {
    await apiRequest<boolean>('/api/auth/forgot-password', {
      method: 'POST',
      body: { email },
    })
    return true
  }

  async me(): Promise<UserProfile> {
    return apiRequest<UserProfile>('/api/auth/me', { auth: true })
  }
}

export const authService: AuthService = new ApiAuthService()
