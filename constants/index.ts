import Constants from 'expo-constants'
import * as Device from 'expo-device'
import { Platform } from 'react-native'

export const APP_NAME = 'ConnectQR'
export const APP_TAGLINE = 'Connect instantly.'

export const CONNECTQR_WEB_BASE =
  (process.env.EXPO_PUBLIC_WEB_BASE as string | undefined)?.replace(/\/+$/, '') ??
  'https://connectqr.app'
export const OFFLINE_SCHEME = 'connectqr://offline'

/**
 * Resolve the API host. An explicit EXPO_PUBLIC_API_URL always wins. Otherwise
 * reuse the host the app was loaded from, because Metro serves the bundle and
 * the API run on the same machine. That keeps a physical device working after
 * the machine's LAN address changes (DHCP), instead of needing a new .env.
 */
function resolveApiBaseUrl(): string {
  const explicit = (process.env.EXPO_PUBLIC_API_URL as string | undefined)?.replace(/\/+$/, '')
  if (explicit) return explicit

  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost
  const host = hostUri?.replace(/^[a-z]+:\/\//i, '').split(':')[0]
  return host ? `http://${host}:3000` : 'http://localhost:3000'
}

export const API_BASE_URL = resolveApiBaseUrl()

export const STORAGE_KEYS = {
  onboardingComplete: 'connectqr.onboarding.complete',
  profile: 'connectqr.profile',
  privacy: 'connectqr.privacy',
  themeMode: 'connectqr.theme.mode',
  qrDesign: 'connectqr.qr.design',
  scanHistory: 'connectqr.scanHistory',
  token: 'connectqr.auth.token',
  deviceKeyId: 'connectqr.device.keyId',
} as const

export const OFFICE_SESSION_MINUTES = 15

export const QR_DESIGN_OPTIONS = {
  colors: [
    { label: 'Ink', value: '#0F172A' },
    { label: 'Coral', value: '#FF5E36' },
    { label: 'Forest', value: '#14532D' },
    { label: 'Navy', value: '#1E3A8A' },
  ] as const,
}

export const USER_HANDLE = 'medi'

/**
 * Shown in the backend's session list so a user can tell their devices apart.
 * Deliberately coarse: model + platform, no identifiers. `Device.osName` is
 * avoided because on some Android builds it returns a long build fingerprint.
 */
export const DEVICE_LABEL = `${Device.modelName ?? Device.deviceName ?? 'Device'} (${Platform.OS})`
