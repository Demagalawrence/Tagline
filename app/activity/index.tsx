import { useCallback, useEffect, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '@/components/Screen'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Text } from '@/components/Text'
import { Card } from '@/components/Card'
import { ListItem } from '@/components/ListItem'
import { SectionHeader } from '@/components/SectionHeader'
import { Button } from '@/components/Button'
import { StatusBadge } from '@/components/StatusBadge'
import { EmptyState } from '@/components/EmptyState'
import { LoadingScreen } from '@/components/Skeleton'
import { connectionService } from '@/services/connectionService'
import { authService } from '@/services/authService'
import { timeAgo } from '@/utils/format'
import { successHaptic } from '@/utils/haptics'
import { spacing } from '@/theme'

export default function ActivityScreen() {
  const router = useRouter()
  const [feed, setFeed] = useState<Awaited<
    ReturnType<typeof connectionService.getActivity>
  > | null>(null)
  const [resending, setResending] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    return await connectionService.getActivity()
  }, [])

  useEffect(() => {
    let active = true
    void load().then((data) => {
      if (active) setFeed(data)
    })
    return () => {
      active = false
    }
  }, [load])

  const onResendVerification = useCallback(async () => {
    const email = feed?.account?.email
    if (!email) return
    setResending(true)
    try {
      const res = await authService.resendVerification(email)
      setNotice(res.sent ? 'Verification email sent.' : 'This email is already verified.')
      void successHaptic()
    } catch {
      setNotice("Couldn't send the email. Please try again later.")
    } finally {
      setResending(false)
    }
  }, [feed?.account?.email])

  const stats = useMemo(() => {
    const account = feed?.account
    return [
      { label: 'People scanned your card', value: account?.scanCount ?? 0 },
      { label: 'Connections saved', value: feed?.connections.length ?? 0 },
      {
        label: 'Last scan',
        value: account?.lastScannedAt ? timeAgo(account.lastScannedAt) : 'None yet',
      },
    ]
  }, [feed])

  if (!feed) {
    return <LoadingScreen />
  }

  const account = feed.account
  const needsVerification = account ? !account.emailVerified : false

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <ScreenHeader title="Activity" onBack={() => router.back()} />
      <View style={styles.body}>
        {needsVerification && account ? (
          <Card style={styles.verifyCard}>
            <StatusBadge label="Unverified email" tone="warning" />
            <Text variant="body" color="secondary" style={styles.verifyBody}>
              {`Confirm ${account.email} to protect your account and recover access if you lose your phone.`}
            </Text>
            <Button
              label={resending ? 'Sending…' : 'Resend verification email'}
              onPress={() => void onResendVerification()}
              loading={resending}
              size="sm"
            />
          </Card>
        ) : account ? (
          <Card style={styles.verifyCard}>
            <StatusBadge label="Email verified" tone="success" />
            <Text variant="body" color="secondary" style={styles.verifyBody}>
              {account.email}
            </Text>
          </Card>
        ) : null}

        {notice ? (
          <Text variant="caption" color="secondary">
            {notice}
          </Text>
        ) : null}

        <View>
          <SectionHeader title="Your stats" />
          <Card padded={false}>
            {stats.map((s, i) => (
              <ListItem
                key={s.label}
                title={s.label}
                valueLabel={String(s.value)}
                leftIcon="stats-chart-outline"
                last={i === stats.length - 1}
              />
            ))}
          </Card>
        </View>

        <View>
          <SectionHeader title="Recent scans" />
          {feed.connections.length === 0 ? (
            <EmptyState
              icon="scan-outline"
              title="Nothing scanned yet"
              message="Every ConnectQR code you scan shows up here."
              actionLabel="Scan a QR"
              onAction={() => router.push('/scan')}
            />
          ) : (
            <Card padded={false}>
              {feed.connections.slice(0, 10).map((c, i) => (
                <ListItem
                  key={c.id}
                  title={c.name}
                  subtitle={`${c.type} · ${timeAgo(c.scannedAt)}`}
                  leftIcon="person-outline"
                  onPress={() => router.push('/connections')}
                  last={i === Math.min(feed.connections.length, 10) - 1}
                />
              ))}
            </Card>
          )}
        </View>

        <Button
          label="View all connections"
          onPress={() => router.push('/connections')}
          variant="secondary"
          fullWidth
        />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xl, gap: spacing['2xl'] },
  body: { gap: spacing['2xl'] },
  verifyCard: { gap: spacing.md },
  verifyBody: {},
})
