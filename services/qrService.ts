import { ParseResult, PrivacySettings, QRType, ScannedContact, UserProfile } from '../types'
import { apiRequest, ApiError } from './api'
import { getRegisteredKeyId } from './keysService'
import { parseContactPayload } from '@/utils/contactFormat'
import { createOfflinePayload, isLegacyOfflinePayload, parseOfflinePayload } from '@/utils/offlinePayload'
import { CONNECTQR_WEB_BASE } from '@/constants'

export interface GenerateOptions {
  privacy?: PrivacySettings
}

export interface QRService {
  generatePayload(user: UserProfile, type: QRType, options?: GenerateOptions): Promise<string>
  parseScannedPayload(raw: string): Promise<ParseResult>
}

interface BackendParseResult {
  contact: Partial<ScannedContact>
  trust: ParseResult['trust']
  format: string
}

/**
 * Talks to the backend for anything that needs a shared source of truth, and
 * falls back to on-device parsing only when the network is unavailable.
 *
 * The previous implementation invented a phone number and an Unsplash avatar
 * for every unrecognised scan. That silently turned a failed scan into a
 * plausible-looking contact, so an unrecognised code now reports as unknown
 * with the raw text and no fabricated details.
 */
export class ApiQRService implements QRService {
  async generatePayload(
    user: UserProfile,
    type: QRType,
    options?: GenerateOptions,
  ): Promise<string> {
    // Offline payloads must work with no connectivity, so they are built on the
    // device rather than requested from the server. When this device has a key
    // registered, the payload names it so a scanner can verify the signature.
    if (type === 'offline') {
      const deviceKeyId = await getRegisteredKeyId()
      return createOfflinePayload(user, options?.privacy, deviceKeyId ?? undefined)
    }

    try {
      const res = await apiRequest<{ payload: string }>('/api/qr/generate', {
        method: 'POST',
        body: { type, privacy: options?.privacy },
        auth: true,
      })
      return res.payload
    } catch (error) {
      if (!(error instanceof ApiError) || !error.isNetworkError) throw error
      return this.generateLocally(user, type)
    }
  }

  /** Device-side generation for the offline case only. */
  private generateLocally(user: UserProfile, type: QRType): string {
    const clean = (user.whatsapp || user.phone || '').replace(/[^\d]/g, '')
    switch (type) {
      case 'whatsapp':
        return `https://wa.me/${clean}`
      case 'vcard':
        return buildSimpleVCard(user)
      case 'mecard':
        return `MECARD:N:${user.name.replace(/[;:]/g, ' ')};TEL:${user.phone};;;`
      case 'profile':
      default:
        return `${CONNECTQR_WEB_BASE}/u/${user.id}`
    }
  }

  async parseScannedPayload(raw: string): Promise<ParseResult> {
    const trimmed = raw.trim()
    if (!trimmed) {
      return {
        contact: {
          id: `scan_${Date.now()}`,
          name: 'Nothing scanned',
          type: 'unknown',
          phone: '',
          whatsapp: '',
          rawPayload: '',
          scannedAt: new Date().toISOString(),
        },
        trust: 'none',
        format: 'empty',
      }
    }

    // v1 carried a shared key inside the app bundle, so anyone who decompiled
    // it could mint a code. Say so plainly instead of guessing at its contents.
    if (isLegacyOfflinePayload(trimmed)) {
      return {
        contact: {
          name: 'Legacy offline code',
          type: 'unknown',
          phone: '',
          whatsapp: '',
          rawPayload: trimmed,
          bio: 'This code used the old shared-key signature, which anyone could forge. Details cannot be trusted.',
        },
        trust: 'unverified',
        format: 'connectqr-offline-v1',
      }
    }

    try {
      const res = await apiRequest<BackendParseResult>('/api/qr/scan', {
        method: 'POST',
        body: { payload: trimmed },
        auth: true,
      })
      return { contact: res.contact, trust: res.trust, format: res.format }
    } catch (error) {
      if (!(error instanceof ApiError) || !error.isNetworkError) throw error
      return this.parseLocally(trimmed)
    }
  }

  /**
   * Offline fallback. Integrity cannot be checked without the sender's
   * registered public key, so a v2 payload is reported as `unverified` rather
   * than trusted; only the server can upgrade that to `verified`.
   */
  private parseLocally(trimmed: string): ParseResult {
    const offline = parseOfflinePayload(trimmed)
    if (offline.ok) {
      return { contact: offline.contact, trust: 'unverified', format: offline.format }
    }
    if (offline.reason !== 'malformed' || isOfflineLike(trimmed)) {
      return {
        contact: {
          name: 'Rejected offline code',
          type: 'unknown',
          phone: '',
          whatsapp: '',
          rawPayload: trimmed,
          bio: 'This offline code failed its integrity check and was rejected.',
        },
        trust: 'tampered',
        format: 'connectqr-offline-v2',
      }
    }

    const contact = parseContactPayload(trimmed)
    if (contact) {
      return {
        contact: {
          id: `scan_${Date.now()}`,
          name: contact.name,
          phone: contact.phone,
          whatsapp: contact.whatsapp || contact.phone,
          email: contact.email,
          title: contact.title,
          company: contact.organization,
          avatar: contact.avatar,
          scannedAt: new Date().toISOString(),
          type: trimmed.toUpperCase().startsWith('MECARD') ? 'mecard' : 'vcard',
          rawPayload: trimmed,
        },
        // A vCard carries no signature; it is a plain data format.
        trust: 'none',
        format: trimmed.toUpperCase().startsWith('MECARD') ? 'mecard' : 'vcard',
      }
    }

    const wa = trimmed.match(/wa\.me\/(\d+)/)
    if (wa) {
      const phone = `+${wa[1]}`
      return {
        contact: {
          id: `scan_${Date.now()}`,
          name: `WhatsApp · ${wa[1].slice(-4)}`,
          phone,
          whatsapp: phone,
          bio: 'Scanned from a WhatsApp link.',
          scannedAt: new Date().toISOString(),
          type: 'whatsapp',
          rawPayload: trimmed,
        },
        trust: 'none',
        format: 'whatsapp',
      }
    }

    return {
      contact: {
        id: `scan_${Date.now()}`,
        name: 'Unrecognised code',
        type: 'unknown',
        phone: '',
        whatsapp: '',
        bio: 'This code is not a ConnectQR, vCard, MECARD, or WhatsApp format.',
        scannedAt: new Date().toISOString(),
        rawPayload: trimmed,
      },
      trust: 'none',
      format: 'unknown',
    }
  }
}

function isOfflineLike(raw: string): boolean {
  return raw.toLowerCase().startsWith('connectqr://')
}

function buildSimpleVCard(user: UserProfile): string {
  const esc = (s: string) => s.replace(/([\\,;])/g, '\\$1')
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${esc(user.name)}`]
  if (user.phone) lines.push(`TEL;TYPE=CELL:${user.phone}`)
  if (user.email) lines.push(`EMAIL;TYPE=INTERNET:${user.email}`)
  if (user.company) lines.push(`ORG:${user.company}`)
  if (user.title) lines.push(`TITLE:${user.title}`)
  if (user.bio) lines.push(`NOTE:${esc(user.bio)}`)
  lines.push('END:VCARD')
  return lines.join('\r\n')
}

export const qrService: QRService = new ApiQRService()
