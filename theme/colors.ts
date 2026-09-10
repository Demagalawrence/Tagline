export const colors = {
  light: {
    primary: '#FF5E36', // Signature Warm Coral / Orange Accent
    primaryHover: '#E04B24',
    primaryLight: '#FFEBE5',
    primaryGlow: 'rgba(255, 94, 54, 0.15)',

    background: '#F7F8FA',
    surface: '#FFFFFF',
    surfaceSecondary: '#F1F3F6',
    surfaceElevated: '#FFFFFF',
    overlay: 'rgba(15, 23, 42, 0.45)',

    border: '#E5E8EE',
    borderFocus: '#FF5E36',

    textPrimary: '#0F172A',
    textSecondary: '#5B6577',
    textMuted: '#98A2B3',
    textInverse: '#FFFFFF',

    statusSuccess: '#10B981',
    statusSuccessBg: '#E8F8F1',
    statusWarning: '#E08C00',
    statusWarningBg: '#FDF3E3',
    statusInfo: '#3B82F6',
    statusInfoBg: '#EDF4FF',

    qrBg: '#FFFFFF',
    qrFg: '#0F172A',
    cardShadow: 'rgba(15, 23, 42, 0.07)',
  },
  dark: {
    primary: '#FF6B4A',
    primaryHover: '#FF8266',
    primaryLight: '#2E1A16',
    primaryGlow: 'rgba(255, 107, 74, 0.28)',

    background: '#0B0C10',
    surface: '#14161D',
    surfaceSecondary: '#1B1E29',
    surfaceElevated: '#20232F',
    overlay: 'rgba(0, 0, 0, 0.6)',

    border: '#262A38',
    borderFocus: '#FF6B4A',

    textPrimary: '#F6F7FA',
    textSecondary: '#9AA3B5',
    textMuted: '#626B7E',
    textInverse: '#0F172A',

    statusSuccess: '#34D399',
    statusSuccessBg: '#0F2A20',
    statusWarning: '#F5B041',
    statusWarningBg: '#33260F',
    statusInfo: '#60A5FA',
    statusInfoBg: '#142B4D',

    qrBg: '#FFFFFF',
    qrFg: '#0F172A',
    cardShadow: 'rgba(0, 0, 0, 0.35)',
  },
};

export type ThemeColors = typeof colors.light;
