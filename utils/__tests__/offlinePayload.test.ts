import {
  base64UrlEncode,
  createOfflinePayload,
  decodeOfflinePayload,
  isLegacyOfflinePayload,
  isOfflinePayload,
  parseOfflinePayload,
} from '@/utils/offlinePayload'
import { PrivacySettings, UserProfile } from '@/types'

const profile: UserProfile = {
  id: 'usr_1',
  name: 'Jane Doe',
  phone: '+256700111111',
  whatsapp: '+256700111111',
  bio: 'Hello',
  email: 'jane@example.com',
  avatar: 'https://example.com/jane.jpg',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const privacy: PrivacySettings = {
  showPhone: true,
  showWhatsapp: true,
  showPhoto: true,
  allowDiscovery: true,
  allowOfflineSharing: true,
}

describe('offlinePayload', () => {
  it('emits the v2 format the server expects', () => {
    const raw = createOfflinePayload(profile, privacy)
    expect(raw.startsWith('connectqr://offline/v2/')).toBe(true)
    expect(isOfflinePayload(raw)).toBe(true)
  })

  it('round-trips a payload', () => {
    const raw = createOfflinePayload(profile, privacy)
    const result = parseOfflinePayload(raw)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.contact.id).toBe('offline_usr_1')
      expect(result.contact.name).toBe('Jane Doe')
      expect(result.contact.phone).toBe('+256700111111')
      expect(result.contact.whatsapp).toBe('+256700111111')
      expect(result.contact.type).toBe('offline')
    }
  })

  it('respects privacy settings', () => {
    const raw = createOfflinePayload(profile, { ...privacy, showPhone: false })
    const result = parseOfflinePayload(raw)
    expect(result.ok && result.contact.phone).toBe('')
    expect(result.ok && result.contact.whatsapp).toBe('+256700111111')
  })

  it('omits the avatar when photo sharing is off', () => {
    const raw = createOfflinePayload(profile, { ...privacy, showPhoto: false })
    const decoded = decodeOfflinePayload(raw)
    expect(decoded?.data.a).toBeUndefined()
  })

  it('never reports a locally-decoded payload as verified', () => {
    // Verification needs the sender's registered public key, which lives on the
    // server. Claiming "verified" here would be a security lie.
    const raw = createOfflinePayload(profile, privacy)
    const result = parseOfflinePayload(raw)
    expect(result.ok && result.trust).toBe('unverified')
  })

  it('reports a forged body as unverified rather than silently trusting it', () => {
    // An attacker can rewrite the body, but cannot forge a valid signature.
    // The local parser cannot detect that, so it must not claim trust; the
    // server is what rejects it.
    const raw = createOfflinePayload(profile, privacy)
    const forged = base64UrlEncode(
      JSON.stringify({ v: 2, uid: 'usr_1', n: 'Someone Else', ph: '+256700000000', ts: 1 }),
    )
    const tampered = `connectqr://offline/v2/${forged}.AAAA`

    const result = parseOfflinePayload(tampered)
    expect(result.ok).toBe(true)
    expect(result.ok && result.trust).toBe('unverified')
  })

  it('flags a structurally malformed payload as tampered', () => {
    expect(parseOfflinePayload('connectqr://offline/v2/nodot')).toEqual({
      ok: false,
      reason: 'malformed',
      trust: 'tampered',
    })
  })

  it('rejects non-offline input', () => {
    expect(parseOfflinePayload('https://example.com')).toEqual({
      ok: false,
      reason: 'malformed',
      trust: 'none',
    })
  })

  it('refuses a legacy v1 code because its shared key was forgeable', () => {
    const legacy = 'connectqr://offline/v1/abc.def'
    expect(isLegacyOfflinePayload(legacy)).toBe(true)
    const result = parseOfflinePayload(legacy)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.reason).toBe('unsupported')
  })
})
