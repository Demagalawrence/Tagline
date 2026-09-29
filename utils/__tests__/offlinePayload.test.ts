import { createOfflinePayload, isOfflinePayload, parseOfflinePayload } from '@/utils/offlinePayload'
import { PrivacySettings, UserProfile } from '@/types'

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  CryptoEncoding: { BASE64: 'base64' },
  digestStringAsync: jest.fn(async (_algo: string, data: string) =>
    btoa(data).replace(/\+/g, '-').replace(/\//g, '_'),
  ),
}))

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
  it('round-trips a payload', async () => {
    const raw = await createOfflinePayload(profile, privacy)
    expect(isOfflinePayload(raw)).toBe(true)

    const result = await parseOfflinePayload(raw)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.contact.id).toBe('offline_usr_1')
      expect(result.contact.name).toBe('Jane Doe')
      expect(result.contact.phone).toBe('+256700111111')
      expect(result.contact.whatsapp).toBe('+256700111111')
      expect(result.contact.type).toBe('offline')
    }
  })

  it('respects privacy settings', async () => {
    const raw = await createOfflinePayload(profile, { ...privacy, showPhone: false })
    const result = await parseOfflinePayload(raw)
    expect(result.ok && result.contact.phone).toBe('')
  })

  it('flags tampered payloads', async () => {
    const raw = await createOfflinePayload(profile, privacy)
    const result = await parseOfflinePayload(raw.slice(0, -4) + 'AAAA')
    expect(result).toEqual({ ok: false, reason: 'tampered' })
  })

  it('rejects malformed input', async () => {
    expect(await parseOfflinePayload('https://example.com')).toEqual({
      ok: false,
      reason: 'malformed',
    })
  })
})
