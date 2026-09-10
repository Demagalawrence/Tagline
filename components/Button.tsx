import { forwardRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Text } from '@/components/Text';
import { Icon, IconName } from '@/components/Icon';
import { radius, spacing } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

const PRESS_SCALE = 0.97;

function usePressScale() {
  const scale = new Animated.Value(1);
  const onPressIn = () => Animated.spring(scale, { toValue: PRESS_SCALE, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  return { scale, onPressIn, onPressOut };
}

export const Button = forwardRef<View, ButtonProps>(function Button(
  {
    label,
    onPress,
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'left',
    loading = false,
    disabled = false,
    fullWidth = false,
    style,
    accessibilityLabel,
  },
  ref,
) {
  const { colors } = useAppTheme();
  const { scale, onPressIn, onPressOut } = usePressScale();

  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isGhost = variant === 'ghost';
  const isDanger = variant === 'danger';
  const isSuccess = variant === 'success';

  const bgColor = isPrimary
    ? colors.primary
    : isSecondary
      ? colors.surfaceSecondary
      : isDanger
        ? colors.statusWarningBg
        : isSuccess
          ? colors.statusSuccess
          : 'transparent';

  const fgColor = isPrimary
    ? colors.textInverse
    : isSecondary
      ? colors.textPrimary
      : isGhost
        ? colors.primary
        : isDanger
          ? colors.statusWarning
          : isSuccess
            ? colors.textInverse
            : colors.textPrimary;

  const dimmed = disabled || loading;
  const actualBg = dimmed ? colors.surfaceSecondary : bgColor;
  const actualFg = dimmed ? colors.textMuted : fgColor;

  const height = size === 'sm' ? 44 : size === 'md' ? 52 : 58;
  const paddingHorizontal = size === 'sm' ? spacing.lg : size === 'md' ? spacing.xl : spacing['2xl'];
  const fontSize = size === 'sm' ? 14 : size === 'md' ? 15 : 16;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth ? styles.fullWidth : null, style]}>
      <Pressable
        ref={ref as never}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={dimmed}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: dimmed, busy: loading }}
        style={({ pressed }) => [
          styles.base,
          {
            height,
            paddingHorizontal,
            backgroundColor: pressed && !dimmed ? colors.primaryLight : actualBg,
            opacity: pressed && !dimmed ? 0.94 : 1,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={actualFg} />
        ) : (
          <>
            {icon && iconPosition === 'left' ? <Icon name={icon} size={size === 'lg' ? 22 : 19} color={actualFg} /> : null}
            <Text variant="button" style={{ color: actualFg, fontSize }}>
              {label}
            </Text>
            {icon && iconPosition === 'right' ? <Icon name={icon} size={size === 'lg' ? 22 : 19} color={actualFg} /> : null}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
});
