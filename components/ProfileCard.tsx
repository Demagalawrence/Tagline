import { Pressable, StyleSheet, View } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Text } from '@/components/Text';
import { Avatar } from '@/components/Avatar';
import { StatusBadge } from '@/components/StatusBadge';
import { Icon } from '@/components/Icon';
import { QrCode } from '@/features/qr/QrCode';
import { radius, spacing } from '@/theme';
import { UserProfile } from '@/types';
import { qrService } from '@/services/qrService';

interface ProfileCardProps {
  user: UserProfile;
  showQr?: boolean;
  onPress?: () => void;
}

export function ProfileCard({ user, showQr = true, onPress }: ProfileCardProps) {
  const { colors } = useAppTheme();
  const payload = qrService.generatePayload(user, 'profile');

  const body = (
    <>
      <View style={styles.top}>
        <Avatar name={user.name} uri={user.avatar} size={64} />
        <View style={styles.info}>
          <Text variant="heading" numberOfLines={1}>
            {user.name}
          </Text>
          <Text variant="body" color="secondary" numberOfLines={1}>
            {user.phone}
          </Text>
        </View>
        <StatusBadge label="Premium" tone="accent" />
      </View>

      {user.bio ? (
        <Text variant="caption" color="secondary" numberOfLines={2} style={styles.bio}>
          {user.bio}
        </Text>
      ) : null}

      {showQr ? (
        <>
          <View style={[styles.qrWrap, { backgroundColor: colors.qrBg }]}>
            <QrCode value={payload} size={132} />
          </View>
          <View style={styles.scanRow}>
            <Icon name="scan-outline" size={16} color={colors.textMuted} />
            <Text variant="caption" color="muted">
              Scan to connect
            </Text>
          </View>
        </>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${user.name} profile card`}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>{body}</View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>{body}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius['2xl'],
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.xl,
    alignItems: 'center',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.lg,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  bio: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  qrWrap: {
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128,128,128,0.18)',
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
