import { qrService } from '@/services/qrService'
import { UserProfile } from '@/types'

// The service prefers the server and falls back to on-device parsing only on a
// network failure. Force the fallback so these tests exercise the local path
// without a running backend.
jest.mock('@/services/api', () => {
  class ApiError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.status = status
    }
    get isNetworkError() {
      return this.status === 0
    }
  }
  return {
    ApiError,
    apiRequest: jest.fn(async () => {
      throw new ApiError(0, 'Network request failed.')
    }),
    getToken: jest.fn(async () => null),
    setToken: jest.fn(async () => {}),
    clearToken: jest.fn(async () => {}),
    onUnauthorized: jest.fn(() => () => {}),
  }
})

const profile: UserProfile = {
  id: 'usr_1',
  name: 'Jane Doe',
  phone: '+256700111111',
  whatsapp: '+256700111111',
  bio: 'Engineer',
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('qrService', () => {
  describe('generatePayload', () => {
    it('builds a WhatsApp payload from the cleaned number', async () => {
      await expect(qrService.generatePayload(profile, 'whatsapp')).resolves.toBe(
        'https://wa.me/256700111111',
      )
    })

    it('builds a vCard with the contact details', async () => {
      const payload = await qrService.generatePayload(profile, 'vcard')
      expect(payload).toContain('BEGIN:VCARD')
      expect(payload).toContain('FN:Jane Doe')
      expect(payload).toContain('+256700111111')
    })

    it('builds a MECARD payload', async () => {
      await expect(qrService.generatePayload(profile, 'mecard')).resolves.toMatch(/^MECARD:/)
    })

    it('builds an offline payload that decodes back to the profile', async () => {
      const payload = await qrService.generatePayload(profile, 'offline')
      expect(payload).toContain('connectqr://offline/v2/')
      const { contact } = await qrService.parseScannedPayload(payload)
      expect(contact.name).toBe('Jane Doe')
    })

    it('omits the phone from an offline payload when privacy hides it', async () => {
      const payload = await qrService.generatePayload(profile, 'offline', {
        privacy: {
          showPhone: false,
          showWhatsapp: true,
          showPhoto: true,
          allowDiscovery: true,
          allowOfflineSharing: true,
        },
      })
      const { contact } = await qrService.parseScannedPayload(payload)
      expect(contact.phone).toBe('')
      expect(contact.whatsapp).toBe('+256700111111')
    })
  })

  describe('parseScannedPayload', () => {
    it('parses a wa.me link into a WhatsApp contact', async () => {
      const { contact, format } = await qrService.parseScannedPayload('https://wa.me/256700111111')
      expect(contact.type).toBe('whatsapp')
      expect(contact.phone).toBe('+256700111111')
      expect(format).toBe('whatsapp')
    })

    it('parses a vCard', async () => {
      const vcard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'FN:Katherine Johnson',
        'TEL;TYPE=CELL:+15551234567',
        'END:VCARD',
      ].join('\r\n')
      const { contact, format } = await qrService.parseScannedPayload(vcard)
      expect(contact.name).toBe('Katherine Johnson')
      expect(contact.phone).toBe('+15551234567')
      expect(format).toBe('vcard')
    })

    it('parses a MECARD payload', async () => {
      const { contact } = await qrService.parseScannedPayload('MECARD:N:Grace Hopper;TEL:+15550001111;;')
      expect(contact.name).toBe('Grace Hopper')
      expect(contact.phone).toBe('+15550001111')
    })

    it('never invents a phone number for an unrecognised code', async () => {
      const { contact, format } = await qrService.parseScannedPayload('just some words')
      expect(format).toBe('unknown')
      expect(contact.type).toBe('unknown')
      // The previous implementation fabricated a plausible number here.
      expect(contact.phone).toBe('')
      expect(contact.avatar).toBeUndefined()
    })

    it('refuses a legacy v1 offline code and explains why', async () => {
      const { trust, format } = await qrService.parseScannedPayload(
        'connectqr://offline/v1/abc.def',
      )
      expect(trust).toBe('unverified')
      expect(format).toBe('connectqr-offline-v1')
    })

    it('does not claim a locally-decoded offline payload is verified', async () => {
      const payload = await qrService.generatePayload(profile, 'offline')
      const { trust } = await qrService.parseScannedPayload(payload)
      // Verification needs the sender's registered key from the server.
      expect(trust).toBe('unverified')
    })

    it('marks a malformed v2 offline payload as tampered', async () => {
      const { trust } = await qrService.parseScannedPayload('connectqr://offline/v2/nodot')
      expect(trust).toBe('tampered')
    })

    it('returns a safe result for an empty string', async () => {
      const { contact, format } = await qrService.parseScannedPayload('   ')
      expect(format).toBe('empty')
      expect(contact.phone).toBe('')
    })
  })
})
