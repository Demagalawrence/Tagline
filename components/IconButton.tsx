import { Animated, Pressable, StyleSheet } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Icon, IconName } from '@/components/Icon';
import { radius, spacing } from '@/theme';

interface IconButtonProps {
  name: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  variant?: 'solid' | 'soft' | 'ghost';
  disabled?: boolean;
}

const PRESS_SCALE = 0.9;

export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  size = 46,
  variant = 'soft',
  disabled = false,
}: IconButtonProps) {
  const { colors } = useAppTheme();
  const scale = new Animated.Value(1);

  const bg =
    variant === 'solid'
      ? colors.primary
      : variant === 'soft'
        ? colors.surfaceSecondary
        : 'transparent';

  const fg = variant === 'solid' ? colors.textInverse : colors.textPrimary;
  const iconSize = size * 0.46;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: PRESS_SCALE, useNativeDriver: true, speed: 50, bounciness: 0 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 0 }).start()}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.base,
          {
            width: size,
            height: size,
            borderRadius: radius.full,
            backgroundColor: disabled ? colors.surfaceSecondary : bg,
          },
        ]}
      >
        <Icon name={name} size={iconSize} color={disabled ? colors.textMuted : fg} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.xs,
  },
});
