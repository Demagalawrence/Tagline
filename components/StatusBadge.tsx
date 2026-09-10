import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Text } from '@/components/Text';
import { radius, spacing } from '@/theme';

type Tone = 'neutral' | 'success' | 'warning' | 'info' | 'accent';

interface StatusBadgeProps {
  label: string;
  tone?: Tone;
  dot?: boolean;
}

export function StatusBadge({ label, tone = 'neutral', dot = false }: StatusBadgeProps) {
  const { colors } = useAppTheme();

  const { bg, fg, dotColor } = (() => {
    switch (tone) {
      case 'success':
        return { bg: colors.statusSuccessBg, fg: colors.statusSuccess, dotColor: colors.statusSuccess };
      case 'warning':
        return { bg: colors.statusWarningBg, fg: colors.statusWarning, dotColor: colors.statusWarning };
      case 'info':
        return { bg: colors.statusInfoBg, fg: colors.statusInfo, dotColor: colors.statusInfo };
      case 'accent':
        return { bg: colors.primaryLight, fg: colors.primary, dotColor: colors.primary };
      default:
        return { bg: colors.surfaceSecondary, fg: colors.textSecondary, dotColor: colors.textMuted };
    }
  })();

  return (
    <View style={[styles.base, { backgroundColor: bg }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      <Text variant="caption" style={{ color: fg, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    gap: spacing.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
  },
});
