import { StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Screen } from '@/components/Screen'
import { Text } from '@/components/Text'
import { Button } from '@/components/Button'
import { StatusBadge } from '@/components/StatusBadge'
import { spacing } from '@/theme'

/**
 * Landing screen for the verification link in the "verify your email" mail. The
 * API consumes the token and redirects here with `status`, so opening the link
 * is all the confirmation that is needed.
 */
export default function VerifiedScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ status?: string }>()
  const ok = params.status !== 'invalid'

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <StatusBadge
          label={ok ? 'Email verified' : 'Link not valid'}
          tone={ok ? 'success' : 'danger'}
        />
        <Text variant="title">{ok ? 'You are all set' : 'This link did not work'}</Text>
        <Text variant="body" color="secondary">
          {ok
            ? 'Your email address is confirmed. Sign in to finish setting up your ConnectQR code.'
            : 'Verification links can only be used once and they expire. Request a new one from the sign-in screen.'}
        </Text>
      </View>

      <Button
        label="Continue to sign in"
        onPress={() => router.replace('/auth/login')}
        fullWidth
        size="lg"
      />
      <Button
        label="Back"
        onPress={() => router.replace('/auth/login')}
        variant="ghost"
        fullWidth
        style={styles.back}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: spacing['2xl'],
    justifyContent: 'center',
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing['3xl'],
  },
  back: {
    marginTop: spacing['3xl'],
  },
})
