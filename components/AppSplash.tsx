import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { APP_NAME, APP_TAGLINE } from '@/constants';
import { radius, spacing } from '@/theme';

const SPLASH_BG = '#0B0C10';
const SPLASH_TEXT = '#F6F7FA';
const SPLASH_MUTED = 'rgba(246,247,250,0.6)';
const SPLASH_BOX = 'rgba(255,255,255,0.08)';
const SPLASH_BORDER = 'rgba(255,255,255,0.14)';

export function AppSplash({ exiting, onExited }: { exiting?: boolean; onExited?: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale]);

  useEffect(() => {
    if (!exiting) return;
    Animated.timing(opacity, { toValue: 0, duration: 280, useNativeDriver: true }).start(({ finished }) => {
      if (finished) onExited?.();
    });
  }, [exiting, opacity, onExited]);

  return (
    <Animated.View style={[styles.fill, { backgroundColor: SPLASH_BG, opacity }]}>
      <Animated.View style={[styles.logoWrap, { transform: [{ scale }] }]}>
        <Image source={require('../assets/favicon.png')} style={styles.logo} resizeMode="contain" />
      </Animated.View>
      <View style={styles.brand}>
        <Text variant="title" align="center" style={styles.brandTitle}>
          {APP_NAME}
        </Text>
        <Text variant="body" align="center" style={styles.tagline}>
          {APP_TAGLINE}
        </Text>
      </View>
      <Text variant="caption" align="center" style={styles.status}>
        Connecting...
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
  },
  logoWrap: {
    width: 168,
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius['2xl'],
    backgroundColor: SPLASH_BOX,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SPLASH_BORDER,
  },
  logo: {
    width: 140,
    height: 140,
  },
  brand: {
    marginTop: spacing['2xl'],
    gap: spacing.xs,
  },
  brandTitle: {
    color: SPLASH_TEXT,
  },
  tagline: {
    marginTop: spacing.xs,
    color: SPLASH_MUTED,
  },
  status: {
    position: 'absolute',
    bottom: spacing['4xl'],
    color: SPLASH_MUTED,
  },
});
