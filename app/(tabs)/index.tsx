import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { SectionHeader } from '@/components/SectionHeader';
import { ListItem } from '@/components/ListItem';
import { EmptyState } from '@/components/EmptyState';
import { useProfileStore } from '@/store/useProfileStore';
import { useAuthStore } from '@/store/useAuthStore';
import { connectionService } from '@/services/connectionService';
import { greetingForHour, timeAgo } from '@/utils/format';
import { spacing } from '@/theme';
import { ScannedContact } from '@/types';

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const [connections, setConnections] = useState<ScannedContact[] | null>(null);

  useEffect(() => {
    let active = true;
    void connectionService.getRecentConnections().then((data) => {
      if (active) setConnections(data);
    });
    return () => {
      active = false;
    };
  }, []);

  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);
  const displayName = user?.name ?? profile.name;

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <View style={styles.topInfo}>
          <Text variant="caption" color="secondary">
            {greeting}
          </Text>
          <Text variant="title">{displayName}</Text>
        </View>
        <IconButton name="notifications-outline" onPress={() => {}} accessibilityLabel="Notifications" size={44} variant="soft" />
      </View>

      <Card style={styles.profileCard} elevated>
        <View style={styles.profileRow}>
          <Avatar name={displayName} uri={profile.avatar} size={56} />
          <View style={styles.profileText}>
            <Text variant="bodyStrong">{profile.title ?? profile.bio}</Text>
            <Text variant="caption" color="muted" numberOfLines={1}>
              {profile.email}
            </Text>
          </View>
        </View>
        <Text variant="body" color="secondary" numberOfLines={2} style={styles.bio}>
          {profile.bio}
        </Text>
        <View style={styles.profileActions}>
          <Button label="My QR" onPress={() => router.push('/my-qr')} size="sm" icon="qr-code-outline" />
          <Button label="Scan" onPress={() => router.push('/scan')} size="sm" variant="secondary" icon="scan-outline" />
        </View>
      </Card>

      <View style={styles.section}>
        <SectionHeader title="Recent connections" actionLabel={connections && connections.length > 0 ? 'See all' : undefined} onAction={() => router.push('/offline/nearby')} />
        {connections === null ? null : connections.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No connections yet"
            message="Scan a ConnectQR code to start building your network."
            actionLabel="Scan a QR"
            onAction={() => router.push('/scan')}
          />
        ) : (
          <Card padded={false}>
            {connections.slice(0, 3).map((c, i) => (
              <ListItem
                key={c.id}
                title={c.name}
                subtitle={`${c.title ?? 'ConnectQR'} · ${timeAgo(c.scannedAt)}`}
                leftIcon="person-outline"
                onPress={() => router.push('/offline/nearby')}
                last={i === Math.min(connections.length, 3) - 1}
              />
            ))}
          </Card>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Offline Connect" />
        <Card>
          <Text variant="body" color="secondary">
            Share your profile over a local Wi-Fi network when there's no Internet.
          </Text>
          <Button label="Open Offline Connect" onPress={() => router.push('/offline')} variant="secondary" icon="wifi-outline" style={styles.offlineAction} />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing['6xl'],
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing['2xl'],
  },
  topInfo: {
    gap: 2,
  },
  profileCard: {
    marginBottom: spacing['2xl'],
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  profileText: {
    flex: 1,
    marginLeft: spacing.md,
    gap: 2,
  },
  bio: {
    marginBottom: spacing.lg,
  },
  profileActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  offlineAction: {
    marginTop: spacing.lg,
  },
});
