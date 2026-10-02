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
  emailVerified?: boolean
  scanCount?: number
  scansPerformed?: number
  lastScannedAt?: string
  createdAt: string
}

export interface AuthSessionInfo {
  id: string
  deviceLabel: string
  userAgent?: string
  ipAddress?: string
  createdAt: string
  lastUsedAt?: string
  expiresAt: string
  revokedAt?: string
  isCurrent: boolean
  isActive: boolean
}

export interface PrivacySettings {
  showPhone: boolean
  showWhatsapp: boolean
  showPhoto: boolean
  allowDiscovery: boolean
  allowOfflineSharing: boolean
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
  type: 'whatsapp' | 'profile' | 'offline' | 'unknown'
  rawPayload: string
  tags?: string[]
}

export interface NearbyDevice {
  id: string
  name: string
  phone: string
  avatar?: string
  status: 'searching' | 'connected' | 'waiting' | 'offline'
  signalStrength: number
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

export type QRType = 'whatsapp' | 'profile' | 'offline'
