import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useEffect, useState } from 'react'
import { Stack, Redirect } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApiError } from '@/services/api'
import { useThemeStore, attachSystemThemeListener } from '@/store/useThemeStore'
import { useOnboardingStore } from '@/store/useOnboardingStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useProfileStore } from '@/store/useProfileStore'
import { useQrDesignStore } from '@/store/useQrDesignStore'
import { useScanHistoryStore } from '@/store/useScanHistoryStore'
import { AppSplash } from '@/components/AppSplash'
import { ErrorBoundary } from '@/components/ErrorBoundary'

/**
 * One client for the app's lifetime. Created lazily inside useState so a fast
 * refresh or remount does not throw away the cache.
 */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cached data is acceptable as a starting point; refetch when back online.
        staleTime: 30_000,
        retry: (failureCount, error) => {
          // Never retry a request that failed for a reason the server will keep
          // rejecting, or one that never reached the network.
          if (error instanceof ApiError && (error.isNetworkError || error.isUnauthorized)) {
            return false
          }
          return failureCount < 2
        },
      },
      mutations: { retry: 0 },
    },
  })
}

export default function RootLayout() {
  const [queryClient] = useState(makeQueryClient)
  const isDark = useThemeStore((state) => state.isDark)
  const themeHydrated = useThemeStore((state) => state.isHydrated)
  const hydrateTheme = useThemeStore((state) => state.hydrate)
  const onboardingHydrated = useOnboardingStore((state) => state.isHydrated)
  const isComplete = useOnboardingStore((state) => state.isComplete)
  const hydrateOnboarding = useOnboardingStore((state) => state.hydrate)
  const authHydrated = useAuthStore((state) => state.isHydrated)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hydrateAuth = useAuthStore((state) => state.hydrate)
  const profileHydrated = useProfileStore((state) => state.isHydrated)
  const hydrateProfile = useProfileStore((state) => state.hydrate)
  const hydrateQrDesign = useQrDesignStore((state) => state.hydrate)
  const hydrateScanHistory = useScanHistoryStore((state) => state.hydrate)

  useEffect(() => {
    attachSystemThemeListener()
    void hydrateTheme()
    void hydrateOnboarding()
    void hydrateQrDesign()
    void hydrateScanHistory()
    void hydrateProfile().then(() => {
      hydrateAuth()
    })
  }, [
    hydrateTheme,
    hydrateOnboarding,
    hydrateQrDesign,
    hydrateScanHistory,
    hydrateProfile,
    hydrateAuth,
  ])

  const allHydrated = themeHydrated && onboardingHydrated && authHydrated && profileHydrated

  const [minElapsed, setMinElapsed] = useState(false)
  const [exited, setExited] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), 1100)
    return () => clearTimeout(timer)
  }, [])

  const exiting = allHydrated && minElapsed && !exited

  if (!exited) {
    return <AppSplash exiting={exiting} onExited={() => setExited(true)} />
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: 'transparent' },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
              <Stack.Screen name="auth" options={{ animation: 'fade' }} />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="profile/scanned"
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen name="settings" />
              <Stack.Screen name="offline" />
            </Stack>
            {!isComplete ? (
              <Redirect href="/onboarding" />
            ) : !isAuthenticated ? (
              <Redirect href="/auth/login" />
            ) : null}
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
