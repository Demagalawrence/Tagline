import { Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ListItem } from '@/components/ListItem';
import { Text } from '@/components/Text';
import { useAuthStore } from '@/store/useAuthStore';
import { spacing } from '@/theme';

export default function SecurityScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const confirmSignOut = () => {
    Alert.alert('Sign out', `Sign out of ConnectQR as ${user?.name ?? 'this account'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          void logout().then(() => router.replace('/auth/login'));
        },
      },
    ]);
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <ScreenHeader title="Security" subtitle="Sessions & sign-out" onBack={() => router.back()} />
      <View style={styles.content}>
        <Card padded={false}>
          <ListItem title="This device" subtitle="Current session" leftIcon="phone-portrait-outline" />
          <ListItem title="Sign-out everywhere" subtitle="Not available in preview" leftIcon="log-out-outline" last />
        </Card>
        <Text variant="caption" color="muted">
          Backend authentication arrives in a later phase. Your profile is stored locally and securely.
        </Text>
        <Button label="Sign Out" onPress={confirmSignOut} variant="danger" icon="log-out-outline" fullWidth />
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
