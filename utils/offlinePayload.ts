import { PrivacySettings, ScannedContact, TrustLevel, UserProfile } from '@/types'

const PREFIX_V2 = 'connectqr://offline/v2/'
const PREFIX_V1 = 'connectqr://offline/v1/'

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const B64_LOOKUP: Record<string, number> = {}
for (let i = 0; i < B64.length; i++) B64_LOOKUP[B64[i]] = i

function utf8ToBytes(str: string): number[] {
  const bytes: number[] = []
  for (let i = 0; i < str.length; i++) {
    let cp = str.codePointAt(i) ?? 0
    if (cp > 0xffff) i++
    if (cp < 0x80) {
      bytes.push(cp)
    } else if (cp < 0x800) {
      bytes.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f))
    } else if (cp < 0x10000) {
      bytes.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f))
    } else {
      bytes.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f),
      )
    }
  }
  return bytes
}

function bytesToUtf8(bytes: number[]): string {
  let out = ''
  for (let i = 0; i < bytes.length;) {
    const b = bytes[i]
    if (b < 0x80) {
      out += String.fromCharCode(b)
      i += 1
    } else if (b < 0xe0) {
      out += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i + 1] & 0x3f))
      i += 2
    } else if (b < 0xf0) {
      out += String.fromCharCode(
        ((b & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f),
      )
      i += 3
    } else {
      const cp =
        ((b & 0x07) << 18) |
        ((bytes[i + 1] & 0x3f) << 12) |
        ((bytes[i + 2] & 0x3f) << 6) |
        (bytes[i + 3] & 0x3f)
      out += String.fromCodePoint(cp)
      i += 4
    }
  }
  return out
}

export function base64UrlEncode(str: string): string {
  const bytes = utf8ToBytes(str)
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]
    const b = bytes[i + 1]
    const c = bytes[i + 2]
    out += B64[a >> 2]
    out += B64[((a & 3) << 4) | (b !== undefined ? b >> 4 : 0)]
    if (b !== undefined) {
      out += B64[((b & 15) << 2) | (c !== undefined ? c >> 6 : 0)]
      if (c !== undefined) out += B64[c & 63]
    }
  }
  return out
}

export function base64UrlDecode(str: string): string {
  const bytes: number[] = []
  for (let i = 0; i < str.length; i += 4) {
    const a = B64_LOOKUP[str[i]]
    const b = B64_LOOKUP[str[i + 1]]
    if (a === undefined || b === undefined) throw new Error('Invalid base64url input')
    bytes.push((a << 2) | (b >> 4))
    const c = B64_LOOKUP[str[i + 2]]
    if (c !== undefined) {
      bytes.push(((b & 15) << 4) | (c >> 2))
      const d = B64_LOOKUP[str[i + 3]]
      if (d !== undefined) bytes.push(((c & 3) << 6) | d)
    }
  }
  return bytesToUtf8(bytes)
}

interface OfflinePayloadData {
  v: 2
  uid: string
  n: string
  ts: number
  kid?: string
  ph?: string
  wa?: string
  a?: string
  t?: string
  c?: string
  e?: string
  b?: string
}

export interface OfflineDecodeResult {
  data: OfflinePayloadData
  /** The exact string a signature covers (everything before the final dot). */
  signedMessage: string | null
  signature: string | null
}

export type OfflinePayloadResult =
  | { ok: true; contact: Partial<ScannedContact>; trust: TrustLevel; format: string }
  | { ok: false; reason: 'malformed' | 'unsupported' | 'tampered'; trust: TrustLevel }

export function isOfflinePayload(raw: string): boolean {
  const t = raw.trim()
  return t.startsWith(PREFIX_V2) || t.startsWith(PREFIX_V1)
}

export function isLegacyOfflinePayload(raw: string): boolean {
  return raw.trim().startsWith(PREFIX_V1)
}

/**
 * Builds the unsigned v2 payload. The body matches the server's format exactly
 * so a device signature and a server signature over the same input are
 * interchangeable.
 *
 * The device's Ed25519 private key never leaves the device, so offline sharing
 * works with no internet; the public key is registered with the server and the
 * receiving device asks the server to verify. See keysService.
 */
export function createOfflinePayload(
  profile: UserProfile,
  privacy?: PrivacySettings,
  deviceKeyId?: string,
): string {
  const effective: PrivacySettings = privacy ?? {
    showPhone: true,
    showWhatsapp: true,
    showPhoto: true,
    allowDiscovery: true,
    allowOfflineSharing: true,
  }

  const data: OfflinePayloadData = {
    v: 2,
    uid: profile.id,
    n: profile.name.trim() || 'Unknown',
    ts: Date.now(),
  }

  if (deviceKeyId) data.kid = deviceKeyId
  if (effective.showPhone && profile.phone) data.ph = profile.phone
  if (effective.showWhatsapp && profile.whatsapp) data.wa = profile.whatsapp
  if (effective.showPhoto && profile.avatar) data.a = profile.avatar
  if (profile.title) data.t = profile.title
  if (profile.company) data.c = profile.company
  if (profile.email) data.e = profile.email
  if (profile.bio) data.b = profile.bio

  return `${PREFIX_V2}${base64UrlEncode(JSON.stringify(data))}.`
}

/**
 * Decodes an offline payload without verifying it.
 *
 * Signature verification requires the sender's registered public key, which
 * lives on the server, so the local result is only ever `unverified`. The QR
 * service is responsible for asking the server to confirm it before claiming
 * `verified`, and this must never be reported as `verified` on its own.
 */
export function parseOfflinePayload(raw: string): OfflinePayloadResult {
  const trimmed = raw.trim()

  if (trimmed.startsWith(PREFIX_V1)) {
    // v1 used a shared key shipped inside the app bundle, so anyone who
    // decompiled it could forge a code. Refuse to present it as trustworthy.
    return { ok: false, reason: 'unsupported', trust: 'unverified' }
  }
  if (!trimmed.startsWith(PREFIX_V2)) {
    return { ok: false, reason: 'malformed', trust: 'none' }
  }

  const body = trimmed.slice(PREFIX_V2.length)
  const dot = body.lastIndexOf('.')
  if (dot <= 0) return { ok: false, reason: 'malformed', trust: 'tampered' }

  const encoded = body.slice(0, dot)
  const signature = body.slice(dot + 1)

  let data: OfflinePayloadData
  try {
    const parsed = JSON.parse(base64UrlDecode(encoded)) as OfflinePayloadData
    if (parsed?.v !== 2 || !parsed.uid || !parsed.n) {
      return { ok: false, reason: 'unsupported', trust: 'unverified' }
    }
    data = parsed
  } catch {
    return { ok: false, reason: 'malformed', trust: 'tampered' }
  }

  return {
    ok: true,
    // No key available locally, so this is unverified until the server says
    // otherwise, and unsigned payloads stay unsigned.
    trust: signature ? 'unverified' : 'unverified',
    format: 'connectqr-offline-v2',
    contact: {
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
      rawPayload: trimmed,
    },
  }
}

/** Exposes the decode parts so a caller can forward them for server verification. */
export function decodeOfflinePayload(raw: string): OfflineDecodeResult | null {
  const trimmed = raw.trim()
  if (!trimmed.startsWith(PREFIX_V2)) return null
  const body = trimmed.slice(PREFIX_V2.length)
  const dot = body.lastIndexOf('.')
  if (dot <= 0) return null
  try {
    const data = JSON.parse(base64UrlDecode(body.slice(0, dot))) as OfflinePayloadData
    if (data?.v !== 2) return null
    return {
      data,
      signedMessage: body.slice(0, dot),
      signature: body.slice(dot + 1) || null,
    }
  } catch {
    return null
  }
}

export type { ScannedContact }
