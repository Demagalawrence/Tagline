import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserProfile, PrivacySettings, ScannedContact, QRType } from '../common/types'
import {
  buildMeCard,
  buildVCard,
  parseContactPayload,
} from '../common/contactFormat'
import { SigningService } from '../signing/signing.service'
import { KeysService } from '../keys/keys.service'
import { User } from '../entities/user.entity'
import { AnalyticsService } from '../analytics/analytics.service'

export const OFFLINE_PREFIX_V2 = 'connectqr://offline/v2/'

export type PayloadTrust = 'verified' | 'unverified' | 'tampered' | 'none'

export interface ParseResult {
  contact: Partial<ScannedContact>
  trust: PayloadTrust
  format: string
}

interface OfflinePayloadData {
  v: 2
  uid: string
  n: string
  kid?: string
  ts: number
  t?: string
  c?: string
  e?: string
  b?: string
  a?: string
  ph?: string
  wa?: string
}

@Injectable()
export class QrService {
  private readonly logger = new Logger(QrService.name)

  constructor(
    private readonly signing: SigningService,
    private readonly keys: KeysService,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly analytics: AnalyticsService,
  ) {}

  generatePayload(
    user: UserProfile,
    type: QRType | 'vcard' | 'mecard',
    privacy?: PrivacySettings,
  ): string {
    switch (type) {
      case 'whatsapp': {
        const digits = user.whatsapp.replace(/[^\d]/g, '')
        return `https://wa.me/${digits}`
      }
      case 'vcard':
        return buildVCard({
          name: user.name,
          phone: privacy?.showPhone ? user.phone : undefined,
          whatsapp: privacy?.showWhatsapp ? user.whatsapp : undefined,
          email: user.email,
          organization: user.company,
          title: user.title,
          url: user.website,
          note: user.bio,
        })
      case 'mecard':
        return buildMeCard({
          name: user.name,
          phone: privacy?.showPhone ? user.phone : undefined,
          email: user.email,
          note: user.bio,
        })
      case 'profile': {
        const slug = user.name.toLowerCase().replace(/\s+/g, '-')
        return `https://connectqr.app/u/${slug || 'profile'}`
      }
      case 'offline':
        // Offline payloads are signed, which is asynchronous. Callers must use
        // buildOfflinePayload (or have the device sign buildUnsignedOfflinePayload),
        // so reaching this branch means the caller skipped that step.
        throw new Error(
          'Offline payloads must be built via buildOfflinePayload; it is async because it signs.',
        )
      default:
        return `https://connectqr.app/u/${user.id}`
    }
  }

  /**
   * Assembles an offline payload body. The signature is applied by the device
   * that owns the key, so this returns the canonical string to sign rather than
   * a finished code.
   */
  buildUnsignedOfflinePayload(
    user: UserProfile,
    privacy: PrivacySettings,
    deviceKeyId?: string,
  ): { unsigned: string; body: string } {
    const data: Record<string, string | number> = {
      v: 2,
      uid: user.id,
      n: user.name.trim() || 'Unknown',
      ts: Date.now(),
    }
    if (deviceKeyId) data.kid = deviceKeyId
    if (privacy.showPhone && user.phone) data.ph = user.phone
    if (privacy.showWhatsapp && user.whatsapp) data.wa = user.whatsapp
    if (privacy.showPhoto && user.avatar) data.a = user.avatar
    if (user.title) data.t = user.title
    if (user.company) data.c = user.company
    if (user.email) data.e = user.email
    if (user.bio) data.b = user.bio

    const plain = JSON.stringify(data)
    const encoded = Buffer.from(plain, 'utf8').toString('base64url')
    // unsigned = exactly the bytes the device must sign.
    return { unsigned: plain, body: `${OFFLINE_PREFIX_V2}${encoded}` }
  }

  /** Server-side signing path, used for QR generation while online. */
  async buildOfflinePayload(
    user: UserProfile,
    privacy: PrivacySettings,
    deviceKeyId?: string,
  ): Promise<string> {
    const { unsigned, body } = this.buildUnsignedOfflinePayload(
      user,
      privacy,
      deviceKeyId,
    )
    const privateKey = process.env.OFFLINE_SIGNING_PRIVATE_KEY
    if (!privateKey) {
      // No server key configured: emit an unsigned payload rather than a
      // payload signed with a secret that would ship to clients anyway.
      this.logger.warn(
        'OFFLINE_SIGNING_PRIVATE_KEY not set; returning unsigned offline payload',
      )
      return `${body}.`
    }
    const sig = this.signing.signWithPem(unsigned, privateKey)
    return `${body}.${sig}`
  }

  async parseScannedPayload(raw: string, scannerId?: string): Promise<ParseResult> {
    const trimmed = raw.trim()
    const result = await this.parsePayload(trimmed)

    // Two different numbers are in play here and conflating them is misleading:
    //   - scansPerformed counts codes this account has scanned, for every format.
    //   - scanCount is the lifetime counter the owner's profile advertises, and
    //     only codes that name an owner can be attributed.
    if (scannerId) {
      await this.recordScanPerformed(scannerId, result.format, result.trust)
    }
    return result
  }

  private async parsePayload(trimmed: string): Promise<ParseResult> {
    if (trimmed.startsWith(OFFLINE_PREFIX_V2)) {
      return this.parseOfflinePayload(trimmed)
    }
    if (trimmed.startsWith('connectqr://offline/v1/')) {
      return {
        contact: {
          name: 'Legacy offline code (unverifiable)',
          type: 'unknown',
          rawPayload: trimmed,
          bio: 'This code used the old shared-key signature, which could be forged. Treat the details with caution.',
        },
        trust: 'unverified',
        format: 'connectqr-offline-v1',
      }
    }

    const contact = parseContactPayload(trimmed)
    if (contact) {
      return {
        contact: {
          id: `vcard_${Date.now()}`,
          name: contact.name,
          phone: contact.phone,
          whatsapp: contact.whatsapp,
          email: contact.email,
          title: contact.title,
          company: contact.organization,
          avatar: contact.avatar,
          bio: contact.note,
          type: 'profile',
          rawPayload: trimmed,
        },
        trust: 'none',
        format: contactFormatName(trimmed),
      }
    }

    if (trimmed.includes('wa.me/')) {
      const match = trimmed.match(/wa\.me\/(\d+)/)
      const phone = match ? `+${match[1]}` : ''
      return {
        contact: {
          name: `WhatsApp Contact (${phone.slice(-4)})`,
          phone,
          whatsapp: phone,
          type: 'whatsapp',
          rawPayload: trimmed,
        },
        trust: 'none',
        format: 'whatsapp',
      }
    }

    if (trimmed.includes('connectqr.app/u/') || trimmed.startsWith('connectqr://profile')) {
      const parts = trimmed.split('/u/')
      const handle = parts[1] || 'profile'
      const name = handle.charAt(0).toUpperCase() + handle.slice(1).replace(/-/g, ' ')
      return {
        contact: { name, type: 'profile', rawPayload: trimmed },
        trust: 'none',
        format: 'connectqr-profile',
      }
    }

    return {
      contact: { name: 'Scanned Contact', type: 'unknown', rawPayload: trimmed },
      trust: 'none',
      format: 'unknown',
    }
  }

  /**
   * Records a scan against the owner account: bumps their lifetime counter and
   * write the timestamp so the profile screen can show "N scans". Fire-and-
   * forget by design - parsing results must never be blocked on analytics.
   */
  private async recordScan(uid: string, trust: PayloadTrust): Promise<void> {
    try {
      await this.users.increment({ id: uid }, 'scanCount', 1)
      await this.users.update(uid, { lastScannedAt: new Date() })
      await this.analytics.track({ name: 'qr.scanned', userId: uid, properties: { trust } })
    } catch {
      // Unknown or deleted owner: nothing to record, and no reason to fail parse.
    }
  }

  /**
   * Records a scan against the scanning account, whichever kind of code it was.
   * Best-effort for the same reason as `recordScan`: analytics must never break
   * a scan.
   */
  private async recordScanPerformed(
    scannerId: string,
    format: string,
    trust: PayloadTrust,
  ): Promise<void> {
    try {
      await this.users.increment({ id: scannerId }, 'scansPerformed', 1)
      await this.analytics.track({
        name: 'qr.scanned_by_user',
        userId: scannerId,
        properties: { format, trust },
      })
    } catch {
      // Best effort only.
    }
  }

  private async parseOfflinePayload(raw: string): Promise<ParseResult> {
    const body = raw.slice(OFFLINE_PREFIX_V2.length)

    // A payload is `<encoded>.<signature>`. An unsigned code has no separator at
    // all: the server emits one whenever no signing key is configured, and the
    // device appends the signature after signing. Treat that whole string as the
    // body and let the missing signature settle trust as `unverified` instead of
    // rejecting an otherwise well-formed code.
    const dot = body.lastIndexOf('.')
    const encoded = dot > 0 ? body.slice(0, dot) : body
    const receivedSig = dot > 0 ? body.slice(dot + 1) : ''

    let data: OfflinePayloadData
    let plain: string
    try {
      plain = Buffer.from(encoded, 'base64url').toString('utf8')
      data = JSON.parse(plain) as OfflinePayloadData
      if (data?.v !== 2 || !data.uid || !data.n) {
        return {
          contact: { name: 'Unsupported offline code', type: 'unknown', rawPayload: raw },
          trust: 'tampered',
          format: 'connectqr-offline-v2',
        }
      }
    } catch {
      return {
        contact: { name: 'Unparseable offline code', type: 'unknown', rawPayload: raw },
        trust: 'tampered',
        format: 'connectqr-offline-v2',
      }
    }

    const trust = await this.assessTrust(plain, receivedSig, data.kid)

    // Owners get scan analytics whenever one of their integrity-protected codes
    // is parsed successfully (default online, offline, or legacy device link).
    if (trust !== 'tampered') {
      await this.recordScan(data.uid, trust)
    }

    const contact: Partial<ScannedContact> = {
      id: `offline_${data.uid}`,
      name: data.n,
      phone: data.ph ?? '',
      whatsapp: data.wa ?? '',
      bio: data.b,
      avatar: data.a,
      title: data.t,
      company: data.c,
      email: data.e,
      scannedAt: new Date(data.ts).toISOString(),
      type: 'offline',
      rawPayload: raw,
    }

    if (trust === 'tampered') {
      return {
        contact: {
          ...contact,
          name: 'Rejected offline code',
          phone: '',
          whatsapp: '',
          bio: 'This code failed its signature check and its details were discarded.',
        },
        trust,
        format: 'connectqr-offline-v2',
      }
    }

    return { contact, trust, format: 'connectqr-offline-v2' }
  }

  /**
   * Resolves trust for an offline payload. A signature that is cryptographically
   * wrong is rejected outright. A correct signature from a key the server does
   * not know is reported as `unverified` rather than silently trusted.
   */
  private async assessTrust(
    plain: string,
    signature: string,
    deviceKeyId?: string,
  ): Promise<PayloadTrust> {
    if (!signature) return 'unverified'
    if (!deviceKeyId) return 'unverified'

    try {
      const key = await this.keys.findById(deviceKeyId)
      if (key.status === 'revoked') return 'tampered'
      const verdict = await this.signing.verifySignature(
        plain,
        signature,
        key.publicKey,
      )
      return verdict.status === 'valid' ? 'verified' : 'tampered'
    } catch {
      // Unknown key id: the signature is well-formed but unattributable.
      return 'unverified'
    }
  }
}

function contactFormatName(raw: string): string {
  return /^BEGIN:VCARD/im.test(raw) ? 'vcard' : 'mecard'
}
