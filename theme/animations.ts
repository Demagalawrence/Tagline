import { Easing } from 'react-native';

export const animations = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
    slower: 600,
  },
  easing: {
    standard: Easing.bezier(0.22, 1, 0.36, 1),
    easeInOut: Easing.inOut(Easing.ease),
    linear: Easing.linear,
  },
  spring: {
    snappy: {
      damping: 18,
      stiffness: 220,
      mass: 0.8,
    } as const,
    gentle: {
      damping: 22,
      stiffness: 160,
      mass: 1,
    } as const,
  },
};

export type Animations = typeof animations;
