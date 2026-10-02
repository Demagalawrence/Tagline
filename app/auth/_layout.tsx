import { Redirect, Stack } from 'expo-router'
import { useAuthStore } from '@/store/useAuthStore'
import { useOnboardingStore } from '@/store/useOnboardingStore'

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isComplete = useOnboardingStore((s) => s.isComplete)

  if (!isComplete) {
    return <Redirect href="/onboarding" />
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="forgot-password" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="reset-password" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="verified" options={{ animation: 'fade' }} />
      <Stack.Screen name="request-link" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="magic-link" options={{ animation: 'fade' }} />
    </Stack>
  )
}
