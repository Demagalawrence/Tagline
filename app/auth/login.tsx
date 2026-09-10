import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { FormInput } from '@/components/FormInput';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { loginSchema, LoginFormValues } from '@/utils/validation';
import { spacing } from '@/theme';

export default function LoginScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = useCallback(
    async (values: LoginFormValues) => {
      const ok = await login(values.email, values.password);
      if (ok) router.replace('/(tabs)');
    },
    [login, router],
  );

  return (
    <Screen scroll keyboardAvoid contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="display" color="accent">
          {'{QR}'}
        </Text>
        <Text variant="title">Welcome back</Text>
        <Text variant="body" color="secondary">
          Sign in to keep sharing your ConnectQR profile.
        </Text>
      </View>

      <View style={styles.form}>
        <FormInput label="Email" name="email" control={control} placeholder="you@example.com" leftIcon="mail-outline" keyboardType="email-address" />
        <FormInput label="Password" name="password" control={control} placeholder="••••••••" leftIcon="lock-closed-outline" secure />
        <Button label={isLoading ? 'Signing in…' : 'Sign In'} onPress={handleSubmit(onSubmit)} loading={isLoading} fullWidth size="lg" />
      </View>

      <View style={styles.links}>
        <Link href="/auth/forgot-password" style={[styles.link, { color: colors.primary }]}>
          Forgot password?
        </Link>
        <View style={styles.row}>
          <Text variant="body" color="secondary">
            New to ConnectQR?{' '}
          </Text>
          <Link href="/auth/register" style={{ color: colors.primary, fontWeight: '600' }}>
            Create account
          </Link>
        </View>
      </View>
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
  links: {
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing['3xl'],
  },
  link: {
    fontWeight: '600',
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
  },
});
