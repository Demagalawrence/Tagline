import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Screen } from '@/components/Screen'
import { Text } from '@/components/Text'
import { Button } from '@/components/Button'
import { QRCard } from '@/components/QRCard'
import { useOnboardingStore } from '@/store/useOnboardingStore'
import { CONNECTQR_WEB_BASE } from '@/constants'
import { spacing } from '@/theme'

/** Example code shown during onboarding, before the user has any profile. */
const SAMPLE_PROFILE_URL = `${CONNECTQR_WEB_BASE}/u/example`

const STEPS = [
  {
    title: 'Scan QR codes to connect',
    body: 'Point your camera at any ConnectQR, WhatsApp, or Offline code and instantly view the person behind it.',
  },
  {
    title: 'Share your own card',
    body: 'Your profile lives behind one QR. Share your WhatsApp, phone, bio, and more with a single scan.',
  },
  {
    title: 'Connect without Internet',
    body: 'No signal? Offline Connect shares your contact over a local Wi-Fi or hotspot instead.',
  },
] as const

export default function OnboardingScreen() {
  const { colors } = useAppTheme()
  const router = useRouter()
  const [step, setStep] = useState(0)

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      void useOnboardingStore
        .getState()
        .complete()
        .then(() => router.replace('/(tabs)'))
    }
  }

  const skip = () => {
    void useOnboardingStore
      .getState()
      .complete()
      .then(() => router.replace('/(tabs)'))
  }

  const current = STEPS[step]

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text variant="display" color="accent">
          {'{QR}'}
        </Text>
        <Text variant="title">Welcome to ConnectQR</Text>
        <Text variant="body" color="secondary">
          Connect instantly — scan, share, done.
        </Text>
      </View>

      <View style={styles.stage}>
        {/* Onboarding runs before sign-in, so there is no profile yet. Show a
            labelled example rather than a fabricated contact. */}
        <QRCard
          payload={SAMPLE_PROFILE_URL}
          type="profile"
          size={180}
          showLogo={false}
          label="Your profile"
        />
      </View>

      <View style={styles.content}>
        <View style={styles.stepDots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i === step ? colors.primary : colors.border }]}
            />
          ))}
        </View>
        <Text variant="heading" align="center" style={styles.stepTitle}>
          {current.title}
        </Text>
        <Text variant="body" color="secondary" align="center" style={styles.stepBody}>
          {current.body}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          label={step === STEPS.length - 1 ? 'Get Started' : 'Next'}
          onPress={next}
          fullWidth
          size="lg"
        />
        <Button label="Skip" onPress={skip} variant="ghost" fullWidth />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: spacing['2xl'],
    paddingTop: spacing['3xl'],
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  header: {
    gap: spacing.xs,
  },
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  content: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  stepDots: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepTitle: {
    marginBottom: spacing.sm,
  },
  stepBody: {
    maxWidth: 320,
  },
  actions: {
    gap: spacing.sm,
  },
})
