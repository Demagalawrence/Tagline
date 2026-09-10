import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/Card';
import { ListItem } from '@/components/ListItem';
import { useThemeStore } from '@/store/useThemeStore';
import { ThemeMode } from '@/types';
import { spacing } from '@/theme';

const OPTIONS: { value: ThemeMode; label: string; subtitle: string }[] = [
  { value: 'light', label: 'Light', subtitle: 'Bright and airy' },
  { value: 'dark', label: 'Dark', subtitle: 'Easy on the eyes' },
  { value: 'system', label: 'System', subtitle: 'Match your device' },
];

export default function AppearanceScreen() {
  const router = useRouter();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <ScreenHeader title="Appearance" subtitle="Theme" onBack={() => router.back()} />
      <View style={styles.content}>
        <Card padded={false}>
          {OPTIONS.map((opt, i) => (
            <ListItem
              key={opt.value}
              title={opt.label}
              subtitle={opt.subtitle}
              leftIcon={opt.value === 'light' ? 'sunny-outline' : opt.value === 'dark' ? 'moon-outline' : 'phone-portrait-outline'}
              valueLabel={mode === opt.value ? 'Selected' : undefined}
              onPress={() => setMode(opt.value)}
              last={i === OPTIONS.length - 1}
            />
          ))}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing['2xl'],
  },
});
