import { useEffect, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Screen } from '@/components/Screen'
import { Text } from '@/components/Text'
import { Button } from '@/components/Button'
import { StatusBadge } from '@/components/StatusBadge'
import { useAuthStore } from '@/store/useAuthStore'
import { spacing } from '@/theme'

/**
 * Landing spot for the emailed sign-in link. The API hands the token over via
 * `connectqr://auth/magic-link?token=...`; exchanging it here is what actually
 * signs the user in, so the link is spent the moment it is opened.
 */
export default function MagicLinkScreen() {
  const router = useRouter()
  const verifyMagicLink = useAuthStore((s) => s.verifyMagicLink)
  const error = useAuthStore((s) => s.error)
  const [failed, setFailed] = useState(false)

  const params = useLocalSearchParams<{ token?: string; error?: string }>()
  const token = typeof params.token === 'string' ? params.token : undefined
  // Derived, not state: a link with no token never started an exchange.
  const missing = !token || params.error === 'missing'
  // useRef guards the one-shot exchange: a re-render must not burn the token.
  const attempted = useRef(false)

  useEffect(() => {
    if (missing || attempted.current) return
    attempted.current = true

    let active = true
    void verifyMagicLink(token as string).then((ok) => {
      if (!active) return
      if (ok) router.replace('/(tabs)')
      else setFailed(true)
    })
    return () => {
      active = false
    }
  }, [token, missing, verifyMagicLink, router])

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.content}>
        {!missing && !failed ? (
          <>
            <Text variant="title">Signing you in</Text>
            <Text variant="body" color="secondary">
              One moment while we check your link.
            </Text>
          </>
        ) : null}

        {failed ? (
          <>
            <StatusBadge label="Link expired" tone="danger" />
            <Text variant="title">That link has expired</Text>
            <Text variant="body" color="secondary">
              Sign-in links last 10 minutes and work once. Request a new one to continue.
            </Text>
            {error ? (
              <Text variant="caption" color="muted">
                {error}
              </Text>
            ) : null}
            <Button
              label="Back to sign in"
              onPress={() => router.replace('/auth/login')}
              fullWidth
              size="lg"
            />
          </>
        ) : null}

        {missing ? (
          <>
            <StatusBadge label="No link token" tone="warning" />
            <Text variant="title">That link was incomplete</Text>
            <Text variant="body" color="secondary">
              Open the link straight from your email, or request a new one.
            </Text>
            <Button
              label="Back to sign in"
              onPress={() => router.replace('/auth/login')}
              fullWidth
              size="lg"
            />
          </>
        ) : null}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: spacing['2xl'],
    justifyContent: 'center',
    gap: spacing.lg,
  },
})
