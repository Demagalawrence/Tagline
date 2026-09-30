import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Text } from '@/components/Text'
import { Avatar } from '@/components/Avatar'
import { Icon } from '@/components/Icon'
import { QrCode } from '@/features/qr/QrCode'
import { radius, spacing } from '@/theme'
import { UserProfile } from '@/types'
import { qrService } from '@/services/qrService'
import { CONNECTQR_WEB_BASE } from '@/constants'

function localProfileUrl(user: UserProfile): string {
  return `${CONNECTQR_WEB_BASE}/u/${user.id}`
}

interface ProfileCardProps {
  user: UserProfile
  showQr?: boolean
  onPress?: () => void
}

export function ProfileCard({ user, showQr = true, onPress }: ProfileCardProps) {
  const { colors } = useAppTheme()
  // Generation is async (it may consult the server), so it cannot happen during
  // render. A profile link is device-local and needs no request, so fall back to
  // it immediately and let the server version replace it if it differs.
  const [payload, setPayload] = useState(() => localProfileUrl(user))

  useEffect(() => {
    let active = true
    void qrService
      .generatePayload(user, 'profile')
      .then((value) => {
        if (active) setPayload(value)
      })
      .catch(() => {
        if (active) setPayload(localProfileUrl(user))
      })
    return () => {
      active = false
    }
  }, [user])

  const body = (
    <>
      <View style={styles.top}>
        <Avatar name={user.name} uri={user.avatar} size={64} />
        <View style={styles.info}>
          <Text variant="heading" numberOfLines={1}>
            {user.name}
          </Text>
          <Text variant="body" color="secondary" numberOfLines={1}>
            {user.phone}
          </Text>
        </View>
      </View>

      {user.bio ? (
        <Text variant="caption" color="secondary" numberOfLines={2} style={styles.bio}>
          {user.bio}
        </Text>
      ) : null}

      {showQr ? (
        <>
          <View style={[styles.qrWrap, { backgroundColor: colors.qrBg }]}>
            <QrCode value={payload} size={132} />
          </View>
          <View style={styles.scanRow}>
            <Icon name="scan-outline" size={16} color={colors.textMuted} />
            <Text variant="caption" color="muted">
              Scan to connect
            </Text>
          </View>
        </>
      ) : null}
    </>
  )

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${user.name} profile card`}
      >
        <View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          {body}
        </View>
      </Pressable>
    )
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {body}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius['2xl'],
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.xl,
    alignItems: 'center',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.lg,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  bio: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  qrWrap: {
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128,128,128,0.18)',
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
})
