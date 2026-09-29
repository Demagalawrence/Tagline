import { create } from 'zustand'
import { UserProfile } from '@/types'
import { authService } from '@/services/authService'
import { getToken } from '@/services/api'
import { MOCK_USER } from '@/mock/user'
import { useProfileStore } from '@/store/useProfileStore'

interface AuthStore {
  isAuthenticated: boolean
  user: UserProfile | null
  isLoading: boolean
  isHydrated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, phone: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  hydrate: () => Promise<void>
  updateUser: (updates: Partial<UserProfile>) => void
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  isAuthenticated: true,
  user: MOCK_USER,
  isLoading: false,
  isHydrated: false,

  hydrate: async () => {
    const token = await getToken()
    if (!token) {
      set({ isAuthenticated: false, user: null, isHydrated: true })
      return
    }
    set({ isAuthenticated: true, isHydrated: true })
    void useProfileStore
      .getState()
      .load()
      .catch(() => {})
  },

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const res = await authService.login(email, password)
      useProfileStore.setState({ profile: res.user })
      void useProfileStore
        .getState()
        .load()
        .catch(() => {})
      set({ isAuthenticated: true, user: res.user, isLoading: false })
      return true
    } catch {
      set({ isLoading: false })
      return false
    }
  },

  register: async (name, email, phone, password) => {
    set({ isLoading: true })
    try {
      const res = await authService.register(name, email, phone, password)
      useProfileStore.setState({ profile: res.user })
      void useProfileStore
        .getState()
        .load()
        .catch(() => {})
      set({ isAuthenticated: true, user: res.user, isLoading: false })
      return true
    } catch {
      set({ isLoading: false })
      return false
    }
  },

  logout: async () => {
    set({ isLoading: true })
    await authService.logout()
    set({ isAuthenticated: false, user: null, isLoading: false })
  },

  updateUser: (updates) => {
    const current = get().user ?? MOCK_USER
    const next: UserProfile = {
      ...current,
      ...updates,
      id: updates.id ?? current.id,
      name: updates.name ?? current.name,
      phone: updates.phone ?? current.phone,
      whatsapp: updates.whatsapp ?? current.whatsapp,
      bio: updates.bio ?? current.bio,
      createdAt: updates.createdAt ?? current.createdAt,
    }
    set({ user: next })
  },
}))
