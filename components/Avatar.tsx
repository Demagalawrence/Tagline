import { Image } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Text } from '@/components/Text';
import { radius } from '@/theme';

interface AvatarProps {
  name: string;
  uri?: string;
  size?: number;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function Avatar({ name, uri, size = 56 }: AvatarProps) {
  const { colors } = useAppTheme();

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: size,
          height: size,
          borderRadius: radius.full,
          backgroundColor: colors.surfaceSecondary,
        }}
        accessibilityLabel={`Photo of ${name}`}
      />
    );
  }

  return (
    <Text
      variant="heading"
      color="accent"
      style={{
        width: size,
        height: size,
        borderRadius: radius.full,
        backgroundColor: colors.primaryLight,
        textAlign: 'center',
        lineHeight: size * 1.05,
        fontSize: size * 0.38,
      }}
    >
      {initials(name)}
    </Text>
  );
}
