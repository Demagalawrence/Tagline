export const APP_NAME = 'ConnectQR';
export const APP_TAGLINE = 'Connect instantly.';

export const CONNECTQR_WEB_BASE = 'https://connectqr.app';
export const OFFLINE_SCHEME = 'connectqr://offline';

export const STORAGE_KEYS = {
  onboardingComplete: 'connectqr.onboarding.complete',
  profile: 'connectqr.profile',
  privacy: 'connectqr.privacy',
  themeMode: 'connectqr.theme.mode',
  qrDesign: 'connectqr.qr.design',
  scanHistory: 'connectqr.scanHistory',
} as const;

export const OFFICE_SESSION_MINUTES = 15;

export const QR_DESIGN_OPTIONS = {
  colors: [
    { label: 'Ink', value: '#0F172A' },
    { label: 'Coral', value: '#FF5E36' },
    { label: 'Forest', value: '#14532D' },
    { label: 'Navy', value: '#1E3A8A' },
  ] as const,
};

export const USER_HANDLE = 'medi';
