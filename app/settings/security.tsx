import { useCallback, useEffect, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '@/components/Screen'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { ListItem } from '@/components/ListItem'
import { StatusBadge } from '@/components/StatusBadge'
import { Text } from '@/components/Text'
import { AuthSession, authService } from '@/services/authService'
import { useAuthStore } from '@/store/useAuthStore'
import { spacing } from '@/theme'

function sessionSubtitle(session: AuthSession): string {
  if (!session.isActive) return session.revokedAt ? 'Signed out' : 'Expired'
  const parts: string[] = []
  if (session.ipAddress) parts.push(session.ipAddress)
  parts.push(session.isCurrent ? 'This device' : 'Active now')
  return parts.join(' · ')
}

export default function SecurityScreen() {
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)

  const [sessions, setSessions] = useState<AuthSession[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setSessions(await authService.listSessions())
    } catch {
      setError('Could not load your signed-in devices.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    void authService
      .listSessions()
      .then((list) => {
        if (active) setSessions(list)
      })
      .catch(() => {
        if (active) setError('Could not load your signed-in devices.')
      })
    return () => {
      active = false
    }
  }, [])

  const confirmRevoke = (session: AuthSession) => {
    Alert.alert(
      'Sign out device',
      `Sign ${session.deviceLabel} out of ConnectQR? It will need to sign in again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            setBusyId(session.id)
            void authService
              .revokeSession(session.id)
              .then(load)
              .catch(() => setError('Could not sign that device out.'))
              .finally(() => setBusyId(null))
          },
        },
      ],
    )
  }

  const confirmSignOutOthers = (others: number) => {
    Alert.alert(
      'Sign out other devices',
      `Sign out ${others} other ${others === 1 ? 'device' : 'devices'}? This device stays signed in.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            setBusyId('others')
            void authService
              .revokeOtherSessions()
              .then(load)
              .catch(() => setError('Could not sign out other devices.'))
              .finally(() => setBusyId(null))
          },
        },
      ],
    )
  }

  const confirmSignOut = () => {
    Alert.alert('Sign out', `Sign out of ConnectQR as ${user?.name ?? 'this account'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          void logout().then(() => router.replace('/auth/login'))
        },
      },
    ])
  }

  const otherActiveCount = sessions?.filter((s) => s.isActive && !s.isCurrent).length ?? 0

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <ScreenHeader title="Security" subtitle="Sessions & sign-out" onBack={() => router.back()} />
      <View style={styles.content}>
        {error ? <StatusBadge label={error} tone="danger" /> : null}

        {sessions === null ? (
          <Text variant="caption" color="muted">
            Loading your devices...
          </Text>
        ) : (
          <Card padded={false}>
            {sessions.map((session, i) => (
              <ListItem
                key={session.id}
                title={session.deviceLabel}
                subtitle={sessionSubtitle(session)}
                leftIcon={session.isCurrent ? 'phone-portrait-outline' : 'tablet-portrait-outline'}
                onPress={
                  session.isActive && !session.isCurrent ? () => confirmRevoke(session) : undefined
                }
                last={i === sessions.length - 1}
                danger={session.isActive && !session.isCurrent}
              />
            ))}
          </Card>
        )}

        <Button
          label={
            otherActiveCount > 0
              ? `Sign out other devices (${otherActiveCount})`
              : 'No other devices'
          }
          onPress={() => confirmSignOutOthers(otherActiveCount)}
          disabled={otherActiveCount === 0 || busyId !== null}
          loading={busyId === 'others'}
          variant="secondary"
          icon="log-out-outline"
          fullWidth
        />

        <Text variant="caption" color="muted">
          Signing out a device ends its session immediately, even if the token has not expired yet.
        </Text>

        <Button
          label="Sign Out"
          onPress={confirmSignOut}
          variant="danger"
          icon="log-out-outline"
          loading={isLoading}
          fullWidth
        />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing['2xl'],
  },
})
