import { useMemo } from 'react';
import { useThemeStore } from '@/store/useThemeStore';
import { colors, radius, spacing, shadows, typography } from '@/theme';
import type { ThemeColors } from '@/theme';

export function useAppTheme() {
  const isDark = useThemeStore((state) => state.isDark);
  const mode = useThemeStore((state) => state.mode);

  return useMemo(
    () => ({
      colors: (isDark ? colors.dark : colors.light) as ThemeColors,
      isDark,
      mode,
      spacing,
      radius,
      shadows,
      typography,
    }),
    [isDark, mode],
  );
}
