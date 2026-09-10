import { Pressable, StyleSheet, View } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Text } from '@/components/Text';
import { Icon, IconName } from '@/components/Icon';
import { Switch } from '@/components/Switch';
import { radius, spacing } from '@/theme';

interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: IconName;
  onPress?: () => void;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  valueLabel?: string;
  last?: boolean;
  danger?: boolean;
}

export function ListItem({
  title,
  subtitle,
  leftIcon,
  onPress,
  switchValue,
  onSwitchChange,
  valueLabel,
  last = false,
  danger = false,
}: ListItemProps) {
  const { colors } = useAppTheme();

  const content = (
    <>
      {leftIcon ? (
        <View style={[styles.iconWrap, { backgroundColor: danger ? colors.statusWarningBg : colors.surfaceSecondary }]}>
          <Icon name={leftIcon} size={20} color={danger ? colors.statusWarning : colors.textSecondary} />
        </View>
      ) : null}
      <View style={styles.textWrap}>
        <Text variant="body" style={{ color: danger ? colors.statusWarning : colors.textPrimary }}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="muted" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {valueLabel ? (
        <Text variant="caption" color="muted">
          {valueLabel}
        </Text>
      ) : null}
      {typeof switchValue === 'boolean' && onSwitchChange ? (
        <Switch value={switchValue} onValueChange={onSwitchChange} accessibilityLabel={title} />
      ) : onPress ? (
        <Icon name="chevron-forward" size={18} color={colors.textMuted} />
      ) : null}
    </>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={title}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }, last ? null : styles.divider]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
    minHeight: 56,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.16)',
  },
});
