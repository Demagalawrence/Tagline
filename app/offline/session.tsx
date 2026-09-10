import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { QRCard } from '@/components/QRCard';
import { StatusBadge } from '@/components/StatusBadge';
import { useCountdown } from '@/hooks/useCountdown';
import { useOfflineStore } from '@/store/useOfflineStore';
import { useProfileStore } from '@/store/useProfileStore';
import { qrService } from '@/services/qrService';
import { formatCountdown } from '@/utils/format';
import { spacing } from '@/theme';

export default function OfflineSessionScreen() {
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const privacy = useProfileStore((s) => s.privacy);
  const session = useOfflineStore((s) => s.session);
  const localIp = useOfflineStore((s) => s.localIp);
  const stopSharing = useOfflineStore((s) => s.stopSharing);
  const expiresInSeconds = useOfflineStore((s) => s.expiresInSeconds);
  const initialSeconds = session?.expiresInSeconds ?? 900;
  const remaining = useCountdown(initialSeconds, !session);
  const [payload, setPayload] = useState('');

  useEffect(() => {
    let active = true;
    void qrService.generatePayload(profile, 'offline', { privacy }).then((value) => {
      if (active) setPayload(value);
    });
    return () => {
      active = false;
    };
  }, [profile, privacy]);

  const networkLabel = session?.networkName ?? (localIp ? `LAN · ${localIp}` : 'ConnectQR-Local');

  const stop = () => {
    void stopSharing().then(() => router.back());
  };

  return (
    <Screen contentContainerStyle={styles.content}>
      <ScreenHeader title="Offline Connect" subtitle="Share without Internet" onBack={() => router.back()} />
      <View style={styles.body}>
        <View style={styles.statusRow}>
          <StatusBadge label="Sharing enabled" tone="success" dot />
        </View>

        <QRCard
          payload={payload}
          type="offline"
          size={210}
          label={networkLabel}
          footerLabel={`Expires in ${formatCountdown(remaining)}`}
        />

        <Card style={styles.hintCard}>
          <Text variant="body" color="secondary" align="center">
            Your contact details are embedded in this code — the other person can scan and save it fully offline.
          </Text>
        </Card>

        <View style={styles.actions}>
          <Button label="Stop Sharing" onPress={stop} variant="danger" icon="stop-circle-outline" fullWidth />
          <Button label="Done" onPress={() => router.back()} variant="ghost" fullWidth />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  body: {
    alignItems: 'center',
  },
  statusRow: {
    alignSelf: 'flex-start',
    marginBottom: spacing['2xl'],
  },
  hintCard: {
    marginTop: spacing['2xl'],
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing['2xl'],
  },
});
