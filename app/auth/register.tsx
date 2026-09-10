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
import { registerSchema, RegisterFormValues } from '@/utils/validation';
import { spacing } from '@/theme';

export default function RegisterScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', phone: '', password: '' },
  });

  const onSubmit = useCallback(
    async (values: RegisterFormValues) => {
      const ok = await register(values.name, values.email, values.phone);
      if (ok) router.replace('/(tabs)');
    },
    [register, router],
  );

  return (
    <Screen scroll keyboardAvoid contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="title">Create your account</Text>
        <Text variant="body" color="secondary">
          Set up your profile and start connecting.
        </Text>
      </View>

      <View style={styles.form}>
        <FormInput label="Full name" name="name" control={control} placeholder="Medi" leftIcon="person-outline" autoCapitalize="words" />
        <FormInput label="Email" name="email" control={control} placeholder="you@example.com" leftIcon="mail-outline" keyboardType="email-address" />
        <FormInput label="Phone" name="phone" control={control} placeholder="+256 700 123 456" leftIcon="call-outline" keyboardType="phone-pad" />
        <FormInput label="Password" name="password" control={control} placeholder="At least 6 characters" leftIcon="lock-closed-outline" secure />
        <Button label={isLoading ? 'Creating account…' : 'Create Account'} onPress={handleSubmit(onSubmit)} loading={isLoading} fullWidth size="lg" />
      </View>

      <View style={styles.footer}>
        <Text variant="body" color="secondary">
          Already have an account?{' '}
        </Text>
        <Link href="/auth/login" style={{ color: colors.primary, fontWeight: '600' }}>
          Sign in
        </Link>
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing['3xl'],
  },
});
