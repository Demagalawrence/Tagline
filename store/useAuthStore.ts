import { create } from 'zustand'
import { UserProfile } from '@/types'
import { authService } from '@/services/authService'
import { getToken, onUnauthorized } from '@/services/api'
import { useProfileStore } from '@/store/useProfileStore'
import { DEFAULT_PRIVACY_SETTINGS } from '@/mock/user'

interface AuthStore {
  isAuthenticated: boolean
  user: UserProfile | null
  isLoading: boolean
  isHydrated: boolean
  /** Distinguishes "wrong password" from "server unreachable". */
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, phone: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  hydrate: () => Promise<void>
  updateUser: (updates: Partial<UserProfile>) => void
  clearError: () => void
}

/** Clears every piece of user-scoped state when a session ends. */
function resetUserState() {
  useProfileStore.setState({
    profile: null,
    privacy: { ...DEFAULT_PRIVACY_SETTINGS },
    isLoading: false,
    isHydrated: false,
  })
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Start signed out. The previous default of `true` sent every user straight
  // into the app with a mock user, so the real sign-in screen was unreachable.
  isAuthenticated: false,
  user: null,
  isLoading: false,
  isHydrated: false,
  error: null,

  hydrate: async () => {
    const token = await getToken()
    if (!token) {
      set({ isAuthenticated: false, user: null, isHydrated: true })
      return
    }

    // A stored token proves nothing on its own: it may be expired or revoked.
    // Confirm it before showing the app.
    try {
      const user = await authService.me()
      set({ isAuthenticated: true, user, isHydrated: true, error: null })
      useProfileStore.setState({ profile: user })
      void useProfileStore.getState().load().catch(() => {})
    } catch {
      // apiRequest already attempted a refresh; if we are here it is unusable.
      set({ isAuthenticated: false, user: null, isHydrated: true })
      resetUserState()
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const res = await authService.login(email, password)
      useProfileStore.setState({ profile: res.user })
      void useProfileStore.getState().load().catch(() => {})
      set({ isAuthenticated: true, user: res.user, isLoading: false, error: null })
      return true
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unable to sign in. Please try again.',
      })
      return false
    }
  },

  register: async (name, email, phone, password) => {
    set({ isLoading: true, error: null })
    try {
      const res = await authService.register(name, email, phone, password)
      useProfileStore.setState({ profile: res.user })
      void useProfileStore.getState().load().catch(() => {})
      set({ isAuthenticated: true, user: res.user, isLoading: false, error: null })
      return true
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unable to create your account.',
      })
      return false
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await authService.logout()
    } finally {
      set({ isAuthenticated: false, user: null, isLoading: false, error: null })
      resetUserState()
    }
  },

  updateUser: (updates) => {
    const current = get().user
    // Never substitute mock data: if there is no user there is nothing to merge.
    if (!current) return
    set({ user: { ...current, ...updates } })
  },

  clearError: () => set({ error: null }),
}))

// A refresh failure means the session is gone no matter where it happened.
onUnauthorized(() => {
  if (useAuthStore.getState().isAuthenticated) {
    useAuthStore.setState({ isAuthenticated: false, user: null, isLoading: false })
    resetUserState()
  }
})
