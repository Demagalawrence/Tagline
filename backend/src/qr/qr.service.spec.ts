import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { QrService } from './qr.service'
import { KeysService } from '../keys/keys.service'
import { DeviceKey } from '../entities/device-key.entity'
import { SigningService, keyPairFromSeed } from '../signing/signing.service'
import { UserProfile, PrivacySettings } from '../common/types'

const keyPair = keyPairFromSeed(Buffer.alloc(32, 3).toString('base64url'))

const user: UserProfile = {
  id: 'usr_1',
  name: 'Jane Doe',
  phone: '+256700111111',
  whatsapp: '+256700111111',
  bio: 'Engineer',
  email: 'jane@example.com',
  title: 'Staff Engineer',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const privacy: PrivacySettings = {
  showPhone: true,
  showWhatsapp: true,
  showPhoto: true,
  allowDiscovery: true,
  allowOfflineSharing: true,
}

describe('QrService', () => {
  let service: QrService
  let signing: SigningService
  let keys: { findById: jest.Mock }
  let publicKey: string

  beforeEach(async () => {
    keys = { findById: jest.fn() }
    signing = new SigningService()
    publicKey = keyPair.publicKeyB64url

    const moduleRef = await Test.createTestingModule({
      providers: [
        QrService,
        SigningService,
        { provide: KeysService, useValue: keys },
        { provide: getRepositoryToken(DeviceKey), useValue: {} },
      ],
    }).compile()

    service = moduleRef.get(QrService)
  })

  describe('generatePayload', () => {
    it('builds a WhatsApp deep link from the cleaned number', () => {
      expect(service.generatePayload(user, 'whatsapp')).toBe('https://wa.me/256700111111')
    })

    it('builds a vCard that includes the profile fields', () => {
      const card = service.generatePayload(user, 'vcard', privacy)
      expect(card).toContain('BEGIN:VCARD')
      expect(card).toContain('FN:Jane Doe')
      expect(card).toContain('+256700111111')
    })

    it('honours privacy settings when building a vCard', () => {
      const card = service.generatePayload(user, 'vcard', {
        ...privacy,
        showPhone: false,
        showWhatsapp: false,
      })
      expect(card).not.toContain('+256700111111')
    })

    it('builds a MECARD payload', () => {
      expect(service.generatePayload(user, 'mecard', privacy)).toMatch(/^MECARD:/)
    })
  })

  describe('parseScannedPayload', () => {
    it('parses a vCard into a contact', async () => {
      const card = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'FN:Katherine Johnson',
        'TEL;TYPE=CELL:+15551234567',
        'END:VCARD',
      ].join('\r\n')

      const result = await service.parseScannedPayload(card)
      expect(result.format).toBe('vcard')
      expect(result.contact.name).toBe('Katherine Johnson')
      expect(result.contact.phone).toBe('+15551234567')
    })

    it('parses a wa.me link', async () => {
      const result = await service.parseScannedPayload('https://wa.me/256700999888')
      expect(result.format).toBe('whatsapp')
      expect(result.contact.type).toBe('whatsapp')
    })

    it('returns an unknown result for unrecognised text', async () => {
      const result = await service.parseScannedPayload('just some words')
      expect(result.format).toBe('unknown')
      expect(result.contact.type).toBe('unknown')
    })

    it('flags a legacy v1 offline payload as unverified', async () => {
      const result = await service.parseScannedPayload('connectqr://offline/v1/abc.def')
      expect(result.trust).toBe('unverified')
      expect(result.format).toBe('connectqr-offline-v1')
    })
  })

  describe('offline payload trust', () => {
    async function makePayload(kid?: string) {
      const { unsigned, body } = service.buildUnsignedOfflinePayload(user, privacy, kid)
      return { unsigned, body }
    }

    it('marks a payload verified when the registered key matches', async () => {
      const { unsigned, body } = await makePayload('dk_1')
      const signature = signing.signWithPem(unsigned, keyPair.privateKeyPem)
      keys.findById.mockResolvedValue({
        id: 'dk_1',
        publicKey,
        status: 'active',
      } satisfies Partial<DeviceKey>)

      const result = await service.parseScannedPayload(`${body}.${signature}`)
      expect(result.trust).toBe('verified')
      expect(result.contact.name).toBe('Jane Doe')
      expect(result.contact.phone).toBe('+256700111111')
    })

    it('rejects a tampered payload and strips its details', async () => {
      const { unsigned, body } = await makePayload('dk_1')
      // Signature is valid for `unsigned`, but the attacker swaps the body while
      // keeping the same kid, so the key lookup succeeds and the check fails.
      const signature = signing.signWithPem(unsigned, keyPair.privateKeyPem)
      const forged = Buffer.from(
        JSON.stringify({
          v: 2,
          uid: 'usr_1',
          n: 'Someone Else',
          kid: 'dk_1',
          ph: '+256700000000',
          ts: Date.now(),
        }),
        'utf8',
      ).toString('base64url')
      keys.findById.mockResolvedValue({
        id: 'dk_1',
        publicKey,
        status: 'active',
      } satisfies Partial<DeviceKey>)

      const result = await service.parseScannedPayload(
        `connectqr://offline/v2/${forged}.${signature}`,
      )
      expect(result.trust).toBe('tampered')
      // The attacker-supplied phone must not survive into the parsed contact.
      expect(result.contact.phone).toBe('')
      expect(result.contact.name).toBe('Rejected offline code')
      expect(body).toContain('connectqr://offline/v2/')
    })

    it('reports a payload with no kid as unverified, not trusted', async () => {
      // Without a kid there is no registered key to check against. The honest
      // answer is "unverified" - the details are still surfaced, so the UI must
      // label them rather than imply they are authentic.
      const { unsigned, body } = await makePayload(undefined)
      const signature = signing.signWithPem(unsigned, keyPair.privateKeyPem)
      keys.findById.mockClear()

      const result = await service.parseScannedPayload(`${body}.${signature}`)
      expect(result.trust).toBe('unverified')
      expect(result.contact.name).toBe('Jane Doe')
    })

    it('marks a payload unverified when the key is unknown to the server', async () => {
      const { unsigned, body } = await makePayload('dk_missing')
      const signature = signing.signWithPem(unsigned, keyPair.privateKeyPem)
      keys.findById.mockRejectedValue(new Error('not found'))

      const result = await service.parseScannedPayload(`${body}.${signature}`)
      expect(result.trust).toBe('unverified')
    })

    it('treats a revoked key as tampered', async () => {
      const { unsigned, body } = await makePayload('dk_1')
      const signature = signing.signWithPem(unsigned, keyPair.privateKeyPem)
      keys.findById.mockResolvedValue({
        id: 'dk_1',
        publicKey,
        status: 'revoked',
      } satisfies Partial<DeviceKey>)

      const result = await service.parseScannedPayload(`${body}.${signature}`)
      expect(result.trust).toBe('tampered')
    })

    it('rejects a malformed v2 payload', async () => {
      const result = await service.parseScannedPayload('connectqr://offline/v2/nodot')
      expect(result.trust).toBe('tampered')
    })

    it('omits phone from the payload when privacy hides it', async () => {
      const { unsigned } = service.buildUnsignedOfflinePayload(
        user,
        { ...privacy, showPhone: false },
        'dk_1',
      )
      expect(unsigned).not.toContain('"ph"')
      expect(unsigned).toContain('"wa"')
    })
  })
})
