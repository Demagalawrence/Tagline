import { Animated, Pressable, StyleSheet } from 'react-native';
import { useRef } from 'react';
import { useAppTheme } from '@/hooks/useAppTheme';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
}

export function Switch({ value, onValueChange, accessibilityLabel, disabled = false }: SwitchProps) {
  const { colors } = useAppTheme();
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  const toggle = () => {
    const next = !value;
    Animated.spring(anim, {
      toValue: next ? 1 : 0,
      useNativeDriver: false,
      speed: 40,
      bounciness: 0,
    }).start();
    onValueChange(next);
  };

  return (
    <Pressable
      onPress={toggle}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      style={[
        styles.track,
        {
          width: 50,
          height: 30,
          borderRadius: 15,
          backgroundColor: value ? colors.primary : disabled ? colors.surfaceSecondary : colors.border,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: colors.surface,
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 1 },
            elevation: 2,
            transform: [
              {
                translateX: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [2, 22],
                }),
              },
            ],
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  thumb: {},
});
