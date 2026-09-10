import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { ListItem } from '@/components/ListItem';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineStore } from '@/store/useOfflineStore';
import { peerService } from '@/services/peerService';
import { spacing } from '@/theme';

export default function OfflineScreen() {
  const router = useRouter();
  const network = useNetworkStatus();
  const mode = useOfflineStore((s) => s.mode);
  const localIp = useOfflineStore((s) => s.localIp);
  const airplaneMode = useOfflineStore((s) => s.airplaneMode);
  const isSharing = useOfflineStore((s) => s.isSharing);
  const setNetworkStatus = useOfflineStore((s) => s.setNetworkStatus);
  const refreshNetworkInfo = useOfflineStore((s) => s.refreshNetworkInfo);
  const startSharing = useOfflineStore((s) => s.startSharing);
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    setNetworkStatus(network.status);
    void refreshNetworkInfo();
  }, [network.status, setNetworkStatus, refreshNetworkInfo]);

  const openSession = () => {
    void startSharing().then(() => router.push('/offline/session'));
  };

  const openSettings = async (kind: 'wifi' | 'hotspot' | 'airplane') => {
    setOpening(kind);
    try {
      if (kind === 'wifi') await peerService.openWifiSettings();
      else if (kind === 'hotspot') await peerService.openHotspotSettings();
      else await peerService.openAirplaneModeSettings();
    } finally {
      setOpening(null);
    }
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="title">Offline Connect</Text>
        <Text variant="body" color="secondary">
          Share your contact even without Internet.
        </Text>
      </View>

      <View style={styles.statusRow}>
        <StatusBadge
          label={airplaneMode ? 'Airplane mode is on' : network.isConnected ? 'Connected to Wi-Fi' : 'No Wi-Fi'}
          tone={airplaneMode ? 'warning' : network.isConnected ? 'success' : 'warning'}
          dot
        />
      </View>

      {airplaneMode ? (
        <Card style={styles.guideCard}>
          <Text variant="bodyStrong">Turn off airplane mode</Text>
          <Text variant="body" color="secondary" style={styles.guideBody}>
            Offline Connect needs Wi-Fi or a hotspot. Turn off airplane mode to continue.
          </Text>
          <Button
            label="Open Airplane Mode Settings"
            onPress={() => void openSettings('airplane')}
            loading={opening === 'airplane'}
            icon="airplane-outline"
            fullWidth
            disabled={Platform.OS !== 'android'}
          />
        </Card>
      ) : mode !== 'connected' ? (
        <Card style={styles.guideCard}>
          <Text variant="bodyStrong">Connect to a network</Text>
          <Text variant="body" color="secondary" style={styles.guideBody}>
            For nearby devices to find you, connect both phones to the same Wi-Fi, or turn on a mobile hotspot. Your
            contact is embedded in the QR code, so scanning works even with no internet.
          </Text>
          <View style={styles.guideActions}>
            <Button
              label="Open Wi-Fi Settings"
              onPress={() => void openSettings('wifi')}
              loading={opening === 'wifi'}
              variant="secondary"
              icon="wifi-outline"
              fullWidth
              disabled={Platform.OS !== 'android'}
            />
            <Button
              label="Open Hotspot Settings"
              onPress={() => void openSettings('hotspot')}
              loading={opening === 'hotspot'}
              variant="secondary"
              icon="phone-portrait-outline"
              fullWidth
              disabled={Platform.OS !== 'android'}
            />
          </View>
          {Platform.OS !== 'android' ? (
            <Text variant="caption" color="muted" style={styles.iosNote}>
              On iOS, enable Wi-Fi or Personal Hotspot from the Settings app, then come back here.
            </Text>
          ) : null}
        </Card>
      ) : null}

      <Card style={styles.heroCard} elevated>
        <Text variant="bodyStrong">How it works</Text>
        <Text variant="body" color="secondary" style={styles.heroBody}>
          Your contact details are packed into an offline QR code. The other person scans it — no internet, no account
          needed — and the contact is saved.
        </Text>
        <View style={styles.heroActions}>
          <Button label="Show Offline QR" onPress={openSession} loading={isSharing} icon="qr-code-outline" />
          <Button label="Nearby Devices" onPress={() => router.push('/offline/nearby')} variant="secondary" icon="people-outline" />
        </View>
      </Card>

      <View style={styles.section}>
        <Text variant="label" color="secondary" style={styles.sectionTitle}>
          Requirements
        </Text>
        <Card padded={false}>
          <ListItem title="Same network" subtitle="Both devices on the same Wi-Fi or hotspot" leftIcon="wifi-outline" />
          <ListItem title="Scan the Offline QR" subtitle="Contact is embedded in the code" leftIcon="qr-code-outline" last />
        </Card>
      </View>

      {localIp ? (
        <Card style={styles.ipCard}>
          <Text variant="bodyStrong">Your device</Text>
          <Text variant="body" color="secondary">
            Local address: {localIp}
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing['6xl'],
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing['2xl'],
  },
  statusRow: {
    marginBottom: spacing['2xl'],
  },
  guideCard: {
    marginBottom: spacing['2xl'],
  },
  guideBody: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  guideActions: {
    gap: spacing.md,
  },
  iosNote: {
    marginTop: spacing.md,
  },
  heroCard: {
    marginBottom: spacing['2xl'],
  },
  heroBody: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  heroActions: {
    gap: spacing.md,
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  ipCard: {
    marginBottom: spacing['2xl'],
  },
});
