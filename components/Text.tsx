import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { typography } from '@/theme';

type Variant = 'display' | 'title' | 'heading' | 'subheading' | 'body' | 'bodyStrong' | 'caption' | 'label' | 'button';

interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: 'primary' | 'secondary' | 'muted' | 'inverse' | 'accent' | 'success' | 'warning' | 'danger';
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export function Text({ variant = 'body', color = 'primary', align, style, ...rest }: TextProps) {
  const { colors } = useAppTheme();

  const textColor =
    color === 'primary'
      ? colors.textPrimary
      : color === 'secondary'
        ? colors.textSecondary
        : color === 'muted'
          ? colors.textMuted
          : color === 'inverse'
            ? colors.textInverse
            : color === 'accent'
              ? colors.primary
              : color === 'success'
                ? colors.statusSuccess
                : color === 'warning'
                  ? colors.statusWarning
                  : color === 'danger'
                    ? colors.statusWarning
                    : colors.textPrimary;

  return (
    <RNText
      accessibilityRole={variant === 'button' ? 'text' : undefined}
      style={[styles.base, styles[variant], { color: textColor }, align ? { textAlign: align } : null, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.lineHeight.normal * typography.fontSize.md,
  },
  display: {
    fontSize: typography.fontSize['4xl'],
    lineHeight: typography.lineHeight.tight * typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: typography.letterSpacing.tight,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    lineHeight: typography.lineHeight.tight * typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.tight,
  },
  heading: {
    fontSize: typography.fontSize['2xl'],
    lineHeight: typography.lineHeight.tight * typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.tight,
  },
  subheading: {
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.tight * typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  body: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.lineHeight.normal * typography.fontSize.md,
    fontWeight: typography.fontWeight.regular,
  },
  bodyStrong: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.lineHeight.normal * typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  caption: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
  },
  label: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: 'uppercase' as const,
  },
  button: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.lineHeight.tight * typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});
