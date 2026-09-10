import { useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Text } from '@/components/Text';
import { Icon, IconName } from '@/components/Icon';
import { radius, spacing } from '@/theme';

const TAB_ICONS: Record<string, { active: IconName; inactive: IconName; label: string }> = {
  index: { active: 'home', inactive: 'home-outline', label: 'Home' },
  scan: { active: 'scan', inactive: 'scan-outline', label: 'Scan' },
  'my-qr': { active: 'qr-code', inactive: 'qr-code-outline', label: 'My QR' },
  offline: { active: 'wifi', inactive: 'wifi-outline', label: 'Offline' },
  profile: { active: 'person', inactive: 'person-outline', label: 'Profile' },
};

function TabButton({
  routeName,
  isFocused,
  label,
  onPress,
  onLongPress,
}: {
  routeName: string;
  isFocused: boolean;
  label: string;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { colors } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const icons = TAB_ICONS[routeName] ?? { active: 'ellipse', inactive: 'ellipse-outline', label };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, speed: 60, bounciness: 0 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 60, bounciness: 0 }).start()}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      style={styles.tabButton}
    >
      <Animated.View style={[styles.tabInner, { transform: [{ scale }] }]}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: isFocused ? colors.primaryLight : 'transparent',
            },
          ]}
        >
          <Icon
            name={isFocused ? icons.active : icons.inactive}
            size={22}
            color={isFocused ? colors.primary : colors.textMuted}
          />
        </View>
        <Text
          variant="caption"
          style={{
            fontSize: 11,
            lineHeight: 14,
            fontWeight: isFocused ? '700' : '500',
            color: isFocused ? colors.primary : colors.textMuted,
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, shadows } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
            ...(Platform.OS === 'ios' ? shadows.lg : { elevation: 12 }),
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label = options.tabBarLabel ?? options.title ?? TAB_ICONS[route.name]?.label ?? route.name;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });

          return (
            <TabButton
              key={route.key}
              routeName={route.name}
              isFocused={isFocused}
              label={typeof label === 'string' ? label : ''}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bar: {
    flexDirection: 'row',
    borderRadius: radius['2xl'],
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    gap: 2,
  },
  iconWrap: {
    width: 38,
    height: 26,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
