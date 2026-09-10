import { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { FormInput } from '@/components/FormInput';
import { Button } from '@/components/Button';
import { ListItem } from '@/components/ListItem';
import { useProfileStore } from '@/store/useProfileStore';
import { useAuthStore } from '@/store/useAuthStore';
import { profileSchema, ProfileFormValues } from '@/utils/validation';
import { spacing } from '@/theme';
import { successHaptic } from '@/utils/haptics';

const MENU_ITEMS = [
  { label: 'Settings', subtitle: 'App preferences', href: '/settings', icon: 'settings-outline' },
  { label: 'Privacy', subtitle: 'Control what others see', href: '/settings/privacy', icon: 'shield-outline' },
  { label: 'Appearance', subtitle: 'Light, dark, system', href: '/settings/appearance', icon: 'color-palette-outline' },
  { label: 'Security', subtitle: 'Sessions & sign-out', href: '/settings/security', icon: 'shield-checkmark-outline' },
] as const;

export default function ProfileScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const updateUser = useAuthStore((s) => s.updateUser);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile.name,
      phone: profile.phone,
      whatsapp: profile.whatsapp,
      bio: profile.bio,
      email: profile.email ?? '',
      title: profile.title ?? '',
    },
  });

  const bioValue = useWatch({ control, name: 'bio' });

  useEffect(() => {
    reset({
      name: profile.name,
      phone: profile.phone,
      whatsapp: profile.whatsapp,
      bio: profile.bio,
      email: profile.email ?? '',
      title: profile.title ?? '',
    });
  }, [profile, reset]);

  const onSubmit = useCallback(
    async (values: ProfileFormValues) => {
      const ok = await updateProfile({
        name: values.name,
        phone: values.phone,
        whatsapp: values.whatsapp,
        bio: values.bio,
        email: values.email || undefined,
        title: values.title || undefined,
      });
      if (ok) {
        updateUser({ name: values.name, phone: values.phone, whatsapp: values.whatsapp, bio: values.bio });
        void successHaptic();
        reset(values);
      }
    },
    [updateProfile, updateUser, reset],
  );

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Avatar name={profile.name} uri={profile.avatar} size={80} />
        <Text variant="heading" style={styles.name}>
          {profile.name}
        </Text>
        <Text variant="body" color="secondary">
          {profile.title}
        </Text>
        <Text variant="caption" color="muted">
          {profile.email}
        </Text>
      </View>

      <Card style={styles.formCard}>
        <Text variant="label" color="secondary" style={styles.sectionTitle}>
          Profile details
        </Text>
        <FormInput label="Name" name="name" control={control} placeholder="Your name" />
        <FormInput label="Phone" name="phone" control={control} placeholder="+256 700 123 456" keyboardType="phone-pad" />
        <FormInput label="WhatsApp number" name="whatsapp" control={control} placeholder="+256 700 123 456" keyboardType="phone-pad" />
        <FormInput label="Title" name="title" control={control} placeholder="e.g. Software Engineer" />
        <FormInput label="Bio" name="bio" control={control} placeholder="A short bio…" multiline numberOfLines={3} maxLength={120} />
        <Text variant="caption" color="muted" style={styles.counter}>
          {(bioValue ?? '').length}/120
        </Text>
        <Button label="Save Changes" onPress={handleSubmit(onSubmit)} loading={isSubmitting} disabled={!isDirty} fullWidth />
      </Card>

      <View style={styles.menuCard}>
        <Text variant="label" color="secondary" style={styles.sectionTitle}>
          Settings
        </Text>
        <Card padded={false}>
          {MENU_ITEMS.map((item, i) => (
            <ListItem
              key={item.label}
              title={item.label}
              subtitle={item.subtitle}
              leftIcon={item.icon}
              onPress={() => router.push(item.href)}
              last={i === MENU_ITEMS.length - 1}
            />
          ))}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing['6xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    gap: spacing.xs,
  },
  name: {
    marginTop: spacing.sm,
  },
  formCard: {
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  counter: {
    textAlign: 'right',
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  menuCard: {
    marginBottom: spacing['2xl'],
  },
});
