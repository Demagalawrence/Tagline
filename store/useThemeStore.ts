import { create } from 'zustand';
import { Appearance } from 'react-native';
import { ThemeMode } from '@/types';
import { colors, ThemeColors } from '@/theme';
import { STORAGE_KEYS } from '@/constants';
import * as storage from '@/utils/storage';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  isHydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  hydrate: () => Promise<void>;
}

const computeIsDark = (mode: ThemeMode): boolean => {
  if (mode === 'system') {
    return Appearance.getColorScheme() === 'dark';
  }
  return mode === 'dark';
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'system',
  isDark: false,
  isHydrated: false,

  setMode: (mode: ThemeMode) => {
    const isDark = computeIsDark(mode);
    set({ mode, isDark });
    void storage.setItem(STORAGE_KEYS.themeMode, mode);
  },

  hydrate: async () => {
    const stored = await storage.getItem<ThemeMode>(STORAGE_KEYS.themeMode);
    const mode: ThemeMode = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    const isDark = computeIsDark(mode);
    set({ mode, isDark, isHydrated: true });
  },
}));

let systemListenerAttached = false;

export function attachSystemThemeListener() {
  if (systemListenerAttached) return;
  systemListenerAttached = true;
  Appearance.addChangeListener(({ colorScheme }) => {
    const { mode, setMode } = useThemeStore.getState();
    if (mode === 'system') {
      setMode('system');
      const isDark = colorScheme === 'dark';
      useThemeStore.setState({ isDark });
    }
  });
}

export function getThemeColors(): ThemeColors {
  return useThemeStore.getState().isDark ? colors.dark : colors.light;
}
