import { qrService } from '@/services/qrService'
import { UserProfile } from '@/types'

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  CryptoEncoding: { BASE64: 'base64' },
  digestStringAsync: jest.fn(async () => 'sig'),
}))

const profile: UserProfile = {
  id: 'usr_1',
  name: 'Jane Doe',
  phone: '+256700111111',
  whatsapp: '+256700111111',
  bio: '',
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('qrService', () => {
  it('builds a profile payload from the display name', () => {
    const payload = qrService.generatePayload(profile, 'profile')
    expect(payload).toContain('connectqr.app/u/jane-doe')
  })

  it('builds a WhatsApp payload from the cleaned number', () => {
    expect(qrService.generatePayload(profile, 'whatsapp')).toBe('https://wa.me/256700111111')
  })

  it('parses wa.me payloads into a WhatsApp contact', async () => {
    const contact = await qrService.parseScannedPayload('https://wa.me/256700111111')
    expect(contact.name).toContain('WhatsApp Contact')
    expect(contact.type).toBe('whatsapp')
  })

  it('identifies and parses offline payloads', async () => {
    const payload = await qrService.generatePayload(profile, 'offline')
    const contact = await qrService.parseScannedPayload(payload)
    expect(contact.type).toBe('offline')
    expect(contact.name).toBe('Jane Doe')
  })
})
