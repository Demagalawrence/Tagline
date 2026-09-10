import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Card } from '@/components/Card';
import { radius, spacing } from '@/theme';

export function Skeleton({ width, height, style, circle = false }: { width?: number | `${number}%`; height: number; style?: ViewStyle; circle?: boolean }) {
  const { colors } = useAppTheme();
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        { width, height, opacity: pulse, backgroundColor: colors.surfaceSecondary },
        circle ? { borderRadius: radius.full } : { borderRadius: radius.sm },
        style,
      ]}
    />
  );
}

export function LoadingCard() {
  return (
    <Card>
      <Skeleton width="100%" height={16} style={{ marginBottom: spacing.md }} />
      <Skeleton width="70%" height={14} />
    </Card>
  );
}

export function LoadingProfile() {
  return (
    <Card>
      <View style={styles.profileTop}>
        <Skeleton width={72} height={72} circle />
        <View style={styles.profileText}>
          <Skeleton width="70%" height={20} style={{ marginBottom: spacing.sm }} />
          <Skeleton width="45%" height={14} />
        </View>
      </View>
      <Skeleton width="100%" height={160} style={{ marginTop: spacing.xl, borderRadius: radius.lg }} />
    </Card>
  );
}

export function LoadingQR() {
  return (
    <Card style={{ alignItems: 'center' }}>
      <Skeleton width={220} height={220} style={{ borderRadius: radius.lg }} />
      <Skeleton width="50%" height={14} style={{ marginTop: spacing.xl }} />
    </Card>
  );
}

export function LoadingList({ rows = 3 }: { rows?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: rows }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </View>
  );
}

export function LoadingScreen() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.fill, { backgroundColor: colors.background, padding: spacing.xl }]}>
      <Skeleton width="40%" height={28} style={{ marginBottom: spacing['2xl'] }} />
      <LoadingProfile />
      <LoadingList rows={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  profileText: {
    flex: 1,
  },
  list: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
});
