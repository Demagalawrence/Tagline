import { StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '@/components/Screen'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Text } from '@/components/Text'
import { spacing } from '@/theme'
import { APP_NAME } from '@/constants'

export default function PrivacyPolicyScreen() {
  const router = useRouter()
  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <ScreenHeader title="Privacy Policy" onBack={() => router.back()} />
      <View style={styles.body}>
        <Text variant="body" color="secondary">
          {`This is a development build of ${APP_NAME}. This policy describes how the app handles your data in this preview.`}
        </Text>

        <Section title="What we collect">
          <Text variant="body" color="secondary">
            Account details you enter (name, email, phone), the contacts you scan, and basic
            analytics such as how often your QR code is scanned.
          </Text>
        </Section>

        <Section title="What we never collect">
          <Text variant="body" color="secondary">
            Your phone&apos;s address book is only read when you scan a code, and only the scanned
            contact is saved. We do not track your location.
          </Text>
        </Section>

        <Section title="How we use it">
          <Text variant="body" color="secondary">
            Your data is used only to show your ConnectQR profile, let others reach you, and let you
            sign back in. We do not sell or share it with advertisers.
          </Text>
        </Section>

        <Section title="Offline codes">
          <Text variant="body" color="secondary">
            Offline QR payloads are signed by your device key so they can be verified without
            internet. Signing happens on your phone; the private key never leaves it.
          </Text>
        </Section>

        <Section title="Your rights">
          <Text variant="body" color="secondary">
            You can export or permanently delete your account and all associated data at any time
            from Settings. Password resets are available from the sign-in screen.
          </Text>
        </Section>
      </View>
    </Screen>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="subheading" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xl, gap: spacing['2xl'] },
  body: { gap: spacing.xl, paddingBottom: spacing['4xl'] },
  section: { gap: spacing.xs },
  sectionTitle: {},
})
