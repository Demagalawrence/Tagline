import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { FormInput } from '@/components/FormInput';
import { Button } from '@/components/Button';
import { authService } from '@/services/authService';
import { forgotPasswordSchema, ForgotPasswordFormValues } from '@/utils/validation';
import { spacing } from '@/theme';
import { successHaptic } from '@/utils/haptics';

export default function ForgotPasswordScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setLoading(true);
    await authService.forgotPassword(values.email);
    setLoading(false);
    setSent(true);
    void successHaptic();
  };

  return (
    <Screen scroll keyboardAvoid contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="title">Reset your password</Text>
        <Text variant="body" color="secondary">
          Enter the email you signed up with and we'll send you a reset link.
        </Text>
      </View>

      {sent ? (
        <View style={styles.sent}>
          <Text variant="heading" color="success" align="center" style={styles.sentTitle}>
            Check your inbox
          </Text>
          <Text variant="body" color="secondary" align="center">
            If an account exists for that email, a reset link is on its way.
          </Text>
          <Button label="Back to sign in" onPress={() => router.back()} variant="secondary" fullWidth style={styles.sentAction} />
        </View>
      ) : (
        <View style={styles.form}>
          <FormInput label="Email" name="email" control={control} placeholder="you@example.com" leftIcon="mail-outline" keyboardType="email-address" />
          <Button label={loading ? 'Sending…' : 'Send Reset Link'} onPress={handleSubmit(onSubmit)} loading={loading} fullWidth size="lg" />
        </View>
      )}

      <Button label="Back" onPress={() => router.back()} variant="ghost" fullWidth style={styles.back} />
    </Screen>
  );
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
  sent: {
    alignItems: 'center',
    gap: spacing.md,
  },
  sentTitle: {
    marginBottom: spacing.xs,
  },
  sentAction: {
    marginTop: spacing.lg,
  },
  back: {
    marginTop: spacing['3xl'],
  },
});
