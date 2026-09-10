import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/Card';
import { ListItem } from '@/components/ListItem';
import { Text } from '@/components/Text';
import { APP_NAME } from '@/constants';
import { spacing } from '@/theme';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <ScreenHeader title="Settings" onBack={() => router.back()} />
      <View style={styles.content}>
        <Card padded={false}>
          <ListItem title="Privacy" subtitle="Control what others see" leftIcon="shield-outline" onPress={() => router.push('/settings/privacy')} />
          <ListItem title="Appearance" subtitle="Light, dark, system" leftIcon="color-palette-outline" onPress={() => router.push('/settings/appearance')} />
          <ListItem title="Security" subtitle="Sessions & sign-out" leftIcon="shield-checkmark-outline" onPress={() => router.push('/settings/security')} last />
        </Card>
        <Text variant="caption" color="muted" align="center" style={styles.footer}>
          {APP_NAME} · Connect instantly.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing['2xl'],
  },
  footer: {
    marginTop: spacing['2xl'],
  },
});
