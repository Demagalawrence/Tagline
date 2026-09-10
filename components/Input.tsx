import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Text } from '@/components/Text';
import { Icon, IconName } from '@/components/Icon';
import { radius, spacing } from '@/theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: IconName;
  rightIcon?: IconName;
  onRightIconPress?: () => void;
  secure?: boolean;
}

export type { InputProps };

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, leftIcon, rightIcon, onRightIconPress, secure = false, ...rest },
  ref,
) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secure);

  const borderColor = error ? colors.statusWarning : focused ? colors.borderFocus : colors.border;

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text variant="label" color="secondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View style={[styles.container, { backgroundColor: colors.surface, borderColor }]}>
        {leftIcon ? <Icon name={leftIcon} size={19} color={colors.textMuted} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.textPrimary }]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={secure && !hidden}
          autoCorrect={false}
          autoCapitalize="none"
          {...rest}
        />
        {secure ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            hitSlop={10}
          >
            <Icon name={hidden ? 'eye-outline' : 'eye-off-outline'} size={19} color={colors.textMuted} />
          </Pressable>
        ) : rightIcon ? (
          <Pressable onPress={onRightIconPress} accessibilityRole="button" accessibilityLabel="Field action" hitSlop={10}>
            <Icon name={rightIcon} size={19} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" color="warning" style={styles.message}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color="muted" style={styles.message}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.sm,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    minHeight: 54,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: spacing.md,
  },
  message: {
    marginTop: spacing.sm,
  },
});
