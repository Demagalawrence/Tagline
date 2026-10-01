import { useEffect, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Screen } from '@/components/Screen'
import { Text } from '@/components/Text'
import { Avatar } from '@/components/Avatar'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { IconButton } from '@/components/IconButton'
import { StatusBadge } from '@/components/StatusBadge'
import { qrService } from '@/services/qrService'
import { whatsappService } from '@/features/whatsapp/whatsappService'
import { callService } from '@/features/calls/callService'
import { contactsService } from '@/features/contacts/contactsService'
import { shareContactAsVCard } from '@/features/contacts/vcard'
import { ScannedContact, TrustLevel } from '@/types'
import { radius, spacing } from '@/theme'
import { successHaptic, warningHaptic, errorHaptic } from '@/utils/haptics'

type Action = 'whatsapp' | 'call' | 'save' | 'share' | null

export default function ScannedContactScreen() {
  const { colors } = useAppTheme()
  const router = useRouter()
  const params = useLocalSearchParams<{ payload?: string; id?: string }>()
  const [contact, setContact] = useState<ScannedContact | null>(null)
  const [trust, setTrust] = useState<TrustLevel>('none')
  const [action, setAction] = useState<Action>(null)

  useEffect(() => {
    if (!params.payload) return
    let active = true
    const raw = decodeURIComponent(params.payload)
    void qrService
      .parseScannedPayload(raw)
      .then(({ contact: partial, trust: verdict }) => {
        if (!active) return
        setTrust(verdict)
        setContact({
          id: params.id ?? `scanned_${Date.now()}`,
          name: partial.name ?? 'Unknown contact',
          phone: partial.phone ?? '',
          whatsapp: partial.whatsapp ?? '',
          bio: partial.bio,
          avatar: partial.avatar,
          title: partial.title,
          company: partial.company,
          email: partial.email,
          scannedAt: new Date().toISOString(),
          type: partial.type ?? 'unknown',
          rawPayload: raw,
        })
      })
      .catch(() => {
        if (!active) return
        setTrust('tampered')
        setContact({
          id: params.id ?? `scanned_${Date.now()}`,
          name: 'Could not read this code',
          phone: '',
          whatsapp: '',
          bio: 'Something went wrong while reading this QR code.',
          scannedAt: new Date().toISOString(),
          type: 'unknown',
          rawPayload: raw,
        })
      })
    return () => {
      active = false
    }
  }, [params.payload, params.id])

  const typeBadge = useMemo(() => {
    switch (contact?.type) {
      case 'whatsapp':
        return <StatusBadge label="WhatsApp" tone="success" />
      case 'offline':
        return <StatusBadge label="Offline" tone="info" />
      case 'vcard':
        return <StatusBadge label="vCard" tone="neutral" />
      case 'mecard':
        return <StatusBadge label="MECARD" tone="neutral" />
      case 'profile':
        return <StatusBadge label="ConnectQR" tone="accent" />
      default:
        return <StatusBadge label="Contact" tone="neutral" />
    }
  }, [contact?.type])

  // Only signed formats can be verified. vCard/MECARD/WhatsApp codes are plain
  // data, so claiming they were "verified" would be meaningless.
  const trustBanner = useMemo(() => {
    switch (trust) {
      case 'verified':
        return {
          tone: 'success' as const,
          label: 'Verified',
          body: 'The signature on this code matches a registered device key.',
        }
      case 'unverified':
        return {
          tone: 'warning' as const,
          label: 'Unverified',
          body: 'This code carries no signature we can check. Be careful with the details.',
        }
      case 'tampered':
        return {
          tone: 'danger' as const,
          label: 'Rejected',
          body: 'This code failed its integrity check, so its details have been hidden.',
        }
      default:
        return null
    }
  }, [trust])

  const onWhatsApp = async () => {
    if (!contact) return
    setAction('whatsapp')
    const result = await whatsappService.openChat(contact.whatsapp || contact.phone)
    setAction(null)
    if (result.status === 'opened') {
      void successHaptic()
    } else if (result.status === 'invalid-number') {
      void errorHaptic()
    } else {
      void warningHaptic()
    }
  }

  const onCall = async () => {
    if (!contact) return
    setAction('call')
    const result = await callService.openDialer(contact.phone)
    setAction(null)
    if (result.status === 'opened') void successHaptic()
    else void warningHaptic()
  }

  const onShareCard = async () => {
    if (!contact) return
    setAction('share')
    try {
      await shareContactAsVCard(contact)
      void successHaptic()
    } catch {
      void errorHaptic()
    } finally {
      setAction(null)
    }
  }

  const onSave = async () => {
    if (!contact) return
    setAction('save')
    const result = await contactsService.saveContact(contact)
    setAction(null)
    if (result.status === 'saved') {
      void successHaptic()
    } else {
      void warningHaptic()
    }
  }

  if (!contact) {
    return (
      <View style={[styles.fill, { backgroundColor: colors.background }]}>
        <Text variant="body" color="muted">
          Loading…
        </Text>
      </View>
    )
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Text variant="title">Scanned</Text>
        <IconButton
          name="close"
          onPress={() => router.back()}
          accessibilityLabel="Close"
          size={40}
          variant="soft"
        />
      </View>

      <Card style={styles.card} elevated>
        <Avatar name={contact.name} uri={contact.avatar} size={88} />
        <Text variant="heading" align="center" style={styles.name}>
          {contact.name}
        </Text>
        {contact.title ? (
          <Text variant="body" color="secondary" align="center">
            {contact.title}
          </Text>
        ) : null}
        {contact.company ? (
          <Text variant="caption" color="muted" align="center">
            {contact.company}
          </Text>
        ) : null}
        <View style={styles.badgeRow}>{typeBadge}</View>
        {contact.bio ? (
          <Text variant="body" color="secondary" align="center" style={styles.bio}>
            {contact.bio}
          </Text>
        ) : null}
      </Card>

      {trustBanner ? (
        <View
          style={[
            styles.trustBanner,
            { backgroundColor: colors.statusWarningBg, borderColor: colors.border },
          ]}
          accessibilityRole="alert"
        >
          <StatusBadge label={trustBanner.label} tone={trustBanner.tone} />
          <Text variant="caption" color="secondary" style={styles.trustBody}>
            {trustBanner.body}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          label="WhatsApp"
          onPress={() => void onWhatsApp()}
          icon="logo-whatsapp"
          loading={action === 'whatsapp'}
          fullWidth
          disabled={!contact.whatsapp}
        />
        <Button
          label="Call"
          onPress={() => void onCall()}
          variant="secondary"
          icon="call-outline"
          loading={action === 'call'}
          fullWidth
          disabled={!contact.phone}
        />
        <Button
          label="Save Contact"
          onPress={() => void onSave()}
          variant="secondary"
          icon="person-add-outline"
          loading={action === 'save'}
          fullWidth
        />
        <Button
          label="Share as vCard"
          onPress={() => void onShareCard()}
          variant="ghost"
          icon="share-social-outline"
          loading={action === 'share'}
          fullWidth
        />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexGrow: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing['2xl'],
  },
  card: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  name: {
    marginTop: spacing.lg,
  },
  badgeRow: {
    marginTop: spacing.lg,
  },
  bio: {
    marginTop: spacing.lg,
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  trustBody: {
    flex: 1,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing['2xl'],
  },
})
