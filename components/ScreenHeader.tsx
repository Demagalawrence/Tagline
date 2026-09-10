import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Text } from '@/components/Text';
import { IconButton } from '@/components/IconButton';
import { IconName } from '@/components/Icon';
import { spacing } from '@/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightIcon?: IconName;
  onRightPress?: () => void;
  rightLabel?: string;
}

export function ScreenHeader({ title, subtitle, onBack, rightIcon, onRightPress, rightLabel }: ScreenHeaderProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.row}>
        {onBack ? <IconButton name="arrow-back" onPress={onBack} accessibilityLabel="Go back" size={44} variant="ghost" /> : <View style={styles.placeholder} />}
        <View style={styles.center}>
          <Text variant="subheading" align="center" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" color="muted" align="center" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightIcon || rightLabel ? (
          <IconButton name={rightIcon ?? 'ellipsis-horizontal'} onPress={onRightPress ?? (() => {})} accessibilityLabel={rightLabel ?? 'More actions'} size={44} variant="ghost" />
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  placeholder: {
    width: 44,
  },
});
