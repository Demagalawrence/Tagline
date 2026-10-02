import { useCallback, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Screen } from '@/components/Screen'
import { Text } from '@/components/Text'
import { FormInput } from '@/components/FormInput'
import { Button } from '@/components/Button'
import { StatusBadge } from '@/components/StatusBadge'
import { useAuthStore } from '@/store/useAuthStore'
import { emailSchema, EmailFormValues } from '@/utils/validation'
import { spacing } from '@/theme'

/**
 * Request step of passwordless sign-in. The response is deliberately
 * indistinguishable for a known and unknown address, so this screen always
 * confirms the email was sent rather than revealing who has an account.
 */
export default function RequestMagicLinkScreen() {
  const { colors } = useAppTheme()
  const router = useRouter()
  const requestMagicLink = useAuthStore((s) => s.requestMagicLink)
  const verifyLoginCode = useAuthStore((s) => s.verifyLoginCode)
  const isLoading = useAuthStore((s) => s.isLoading)
  const error = useAuthStore((s) => s.error)
  const clearError = useAuthStore((s) => s.clearError)

  const [sentTo, setSentTo] = useState<string | null>(null)
  const [devCode, setDevCode] = useState<string | null>(null)

  const { control, handleSubmit, getValues } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = useCallback(
    async (values: EmailFormValues) => {
      const res = await requestMagicLink(values.email)
      if (res.ok) {
        setSentTo(values.email)
        setDevCode(res.devLoginCode ?? null)
      }
    },
    [requestMagicLink],
  )

  const onVerifyCode = useCallback(async () => {
    const email = getValues('email')
    if (await verifyLoginCode(email, devCode ?? '')) router.replace('/(tabs)')
  }, [verifyLoginCode, getValues, devCode, router])

  if (sentTo) {
    return (
      <Screen scroll contentContainerStyle={styles.content}>
        <View style={styles.content}>
          <StatusBadge label="Link sent" tone="success" />
          <Text variant="title">Check your email</Text>
          <Text variant="body" color="secondary">
            We sent a sign-in link and a 6-digit code to {sentTo}. Both expire in 10 minutes.
          </Text>

          {devCode ? (
            <>
              <Text variant="caption" color="muted">
                No mail provider is configured, so the code from the server console log is shown
                here.
              </Text>
              <Text variant="heading">{devCode}</Text>
              <Button
                label="Sign in with this code"
                onPress={onVerifyCode}
                loading={isLoading}
                fullWidth
                size="lg"
              />
            </>
          ) : null}

          <Button
            label="Use a different email"
            variant="ghost"
            onPress={() => {
              setSentTo(null)
              setDevCode(null)
              clearError()
            }}
            fullWidth
          />
        </View>
      </Screen>
    )
  }

  return (
    <Screen scroll keyboardAvoid contentContainerStyle={styles.content}>
      <View style={styles.content}>
        <Text variant="title">Sign in without a password</Text>
        <Text variant="body" color="secondary">
          We will email you a link and a 6-digit code. Both work once and expire in 10 minutes.
        </Text>

        <FormInput
          label="Email"
          name="email"
          control={control}
          placeholder="you@example.com"
          leftIcon="mail-outline"
          keyboardType="email-address"
        />

        {error ? <StatusBadge label={error} tone="danger" /> : null}

        <Button
          label="Email me a sign-in link"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          fullWidth
          size="lg"
        />

        <Button
          label="Back to sign in"
          variant="ghost"
          onPress={() => router.back()}
          fullWidth
          style={{ borderColor: colors.border }}
        />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: spacing['2xl'],
    justifyContent: 'center',
    gap: spacing.lg,
  },
})
