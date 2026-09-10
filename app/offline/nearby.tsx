import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { useOfflineStore } from '@/store/useOfflineStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { spacing } from '@/theme';

export default function NearbyDevicesScreen() {
  const router = useRouter();
  const network = useNetworkStatus();
  const devices = useOfflineStore((s) => s.devices);
  const isDiscovering = useOfflineStore((s) => s.isDiscovering);
  const localIp = useOfflineStore((s) => s.localIp);
  const discover = useOfflineStore((s) => s.discover);

  useEffect(() => {
    void discover();
  }, [discover]);

  return (
    <Screen>
      <ScreenHeader title="Nearby Devices" subtitle="People you shared with" onBack={() => router.back()} />
      <View style={styles.content}>
        <Card style={styles.networkCard}>
          <View style={styles.networkRow}>
            <Text variant="bodyStrong">Your network</Text>
            <StatusBadge
              label={network.isConnected ? 'Connected' : 'Offline'}
              tone={network.isConnected ? 'success' : 'neutral'}
              dot
            />
          </View>
          <Text variant="body" color="secondary">
            {localIp ? `Local address: ${localIp}` : 'No local address detected'}
          </Text>
          <Button
            label={isDiscovering ? 'Searching…' : 'Refresh'}
            onPress={() => void discover()}
            variant="secondary"
            size="sm"
            icon="refresh-outline"
            loading={isDiscovering}
            style={styles.refreshBtn}
          />
        </Card>

        {devices.length === 0 ? (
          <EmptyState
            icon="wifi-outline"
            title="No offline peers yet"
            message="People appear here after you exchange contacts over an Offline QR code on the same Wi-Fi or hotspot."
            actionLabel="Show Offline QR"
            onAction={() => router.push('/offline/session')}
          />
        ) : (
          <View style={styles.list}>
            {devices.map((device) => (
              <Card key={device.id} style={styles.deviceCard}>
                <Avatar name={device.name} uri={device.avatar} size={48} />
                <View style={styles.deviceInfo}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {device.name}
                  </Text>
                  <Text variant="caption" color="muted">
                    {device.phone}
                  </Text>
                </View>
                <StatusBadge label="Peer" tone="info" dot />
              </Card>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
  },
  networkCard: {
    marginBottom: spacing['2xl'],
  },
  networkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  refreshBtn: {
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
  },
  list: {
    gap: spacing.md,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  deviceInfo: {
    flex: 1,
    gap: 2,
  },
});
