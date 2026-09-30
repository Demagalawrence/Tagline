export type QRType = 'whatsapp' | 'profile' | 'offline' | 'vcard' | 'mecard'

export type ScannedQRType = QRType | 'unknown'

/**
 * How much the app trusts the details decoded from a scanned code.
 * - verified:   signature checked against a registered device key
 * - unverified: no signature, or a key the server has not seen
 * - tampered:   signature present but invalid, or malformed
 * - none:       not an integrity-protected format
 */
export type TrustLevel = 'verified' | 'unverified' | 'tampered' | 'none'

export interface UserProfile {
  id: string
  name: string
  phone: string
  whatsapp: string
  bio: string
  avatar?: string
  title?: string
  company?: string
  email?: string
  location?: string
  website?: string
  createdAt: string
}

export interface ScannedContact {
  id: string
  name: string
  phone: string
  whatsapp: string
  bio?: string
  avatar?: string
  title?: string
  company?: string
  email?: string
  scannedAt: string
  type: ScannedQRType
  rawPayload: string
}

export interface NearbyDevice {
  id: string
  name: string
  phone: string
  avatar?: string
  status: 'searching' | 'connected' | 'waiting' | 'offline'
  signalStrength: number // 1-100
  lastSeen: string
}

export interface OfflineSession {
  id: string
  networkName: string
  sessionToken: string
  expiresInSeconds: number
  isSharing: boolean
  connectedDevices: NearbyDevice[]
}

export interface PrivacySettings {
  showPhone: boolean
  showWhatsapp: boolean
  showPhoto: boolean
  allowDiscovery: boolean
  allowOfflineSharing: boolean
}

export type ThemeMode = 'light' | 'dark' | 'system'

export interface AuthState {
  isAuthenticated: boolean
  token: string | null
  user: UserProfile | null
}

export type NetworkStatus = 'wifi' | 'cellular' | 'none' | 'unknown'

export type OfflineNetworkMode = 'connected' | 'no-wifi' | 'hotspot' | 'unsupported'

export type QRDesign = {
  fg: string
  includeLogo: boolean
  showLabel: boolean
}

export interface ConnectionGroup {
  id: string
  title: string
  contacts: ScannedContact[]
}

export interface ScanSummary {
  type: ScannedQRType
  contact: ScannedContact
}

/** Result of parsing a scanned code, including its integrity verdict. */
export interface ParseResult {
  contact: Partial<ScannedContact>
  trust: TrustLevel
  /** Server-side format label, e.g. `vcard`, `connectqr-offline-v2`. */
  format: string
}
