import { StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '@/components/Screen'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Text } from '@/components/Text'
import { spacing } from '@/theme'
import { APP_NAME } from '@/constants'

export default function TermsScreen() {
  const router = useRouter()
  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <ScreenHeader title="Terms of Service" onBack={() => router.back()} />
      <View style={styles.body}>
        <Text variant="body" color="secondary">
          {`These terms apply to the ${APP_NAME} preview build. Use it for testing and demonstration purposes.`}
        </Text>

        <Section title="Acceptable use">
          <Text variant="body" color="secondary">
            Do not use the app to transmit abusive, illegal, or malicious content. Respect other
            people&apos;s privacy and do not scrape data without permission.
          </Text>
        </Section>

        <Section title="Your data">
          <Text variant="body" color="secondary">
            You&apos;re responsible for the accuracy of the information you share. You can delete
            your account and all connections at any time from Settings.
          </Text>
        </Section>

        <Section title="Availability">
          <Text variant="body" color="secondary">
            This preview may have bugs or downtime. Features may change or be removed without
            notice.
          </Text>
        </Section>

        <Section title="Liability">
          <Text variant="body" color="secondary">
            The preview is provided &quot;as is&quot; without warranties. The developers are not
            liable for any damages arising from its use.
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
