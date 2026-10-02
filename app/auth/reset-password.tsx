import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Screen } from '@/components/Screen'
import { Text } from '@/components/Text'
import { Input } from '@/components/Input'
import { FormInput } from '@/components/FormInput'
import { Button } from '@/components/Button'
import { authService } from '@/services/authService'
import { resetPasswordSchema, ResetPasswordFormValues } from '@/utils/validation'
import { spacing } from '@/theme'
import { successHaptic, errorHaptic } from '@/utils/haptics'

export default function ResetPasswordScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ token?: string; error?: string }>()
  const [token, setToken] = useState(params.token ?? '')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    params.error === 'missing' ? 'That reset link is missing its code. Request a new email.' : null,
  )

  const { control, handleSubmit } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token.trim()) {
      setError('Paste the reset code from your email.')
      void errorHaptic()
      return
    }
    setLoading(true)
    setError(null)
    try {
      await authService.resetPassword(token.trim(), values.password)
      setDone(true)
      void successHaptic()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That reset link is invalid or expired.')
      void errorHaptic()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen scroll keyboardAvoid contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="title">Choose a new password</Text>
        <Text variant="body" color="secondary">
          Paste the reset code from your email, then pick a new password.
        </Text>
      </View>

      {done ? (
        <View style={styles.done}>
          <Text variant="heading" color="success" align="center">
            Password updated
          </Text>
          <Text variant="body" color="secondary" align="center">
            You can now sign in with your new password.
          </Text>
          <Button
            label="Go to sign in"
            onPress={() => router.replace('/auth/login')}
            fullWidth
            size="lg"
          />
        </View>
      ) : (
        <View style={styles.form}>
          <Input
            label="Reset code"
            placeholder="Paste code from email"
            leftIcon="key-outline"
            value={token}
            onChangeText={setToken}
          />
          <FormInput
            label="New password"
            name="password"
            control={control}
            placeholder="At least 6 characters"
            leftIcon="lock-closed-outline"
            secure
          />
          <FormInput
            label="Confirm new password"
            name="confirmPassword"
            control={control}
            placeholder="Repeat your new password"
            leftIcon="lock-closed-outline"
            secure
          />
          {error ? (
            <Text variant="caption" color="danger">
              {error}
            </Text>
          ) : null}
          <Button
            label={loading ? 'Updating…' : 'Update Password'}
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            fullWidth
            size="lg"
          />
        </View>
      )}

      <Button
        label="Back"
        onPress={() => router.back()}
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
    gap: spacing.xs,
    marginBottom: spacing['3xl'],
  },
  form: {
    gap: spacing.lg,
  },
  done: {
    gap: spacing.md,
  },
  back: {
    marginTop: spacing['3xl'],
  },
})
