import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof Ionicons>['name'];

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 22, color = '#0F172A' }: IconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}

export type { IconProps };
