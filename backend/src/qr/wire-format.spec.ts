import { QrService } from './qr.service'
import { DeviceKey } from '../entities/device-key.entity'
import { SigningService, keyPairFromSeed } from '../signing/signing.service'
import { UserProfile, PrivacySettings } from '../common/types'

const keyPair = keyPairFromSeed(Buffer.alloc(32, 11).toString('base64url'))

const user: UserProfile = {
  id: 'usr_42',
  name: 'Ada Lovelace',
  phone: '+256700999888',
  whatsapp: '+256700999888',
  bio: 'Mathematician',
  email: 'ada@example.com',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const privacy: PrivacySettings = {
  showPhone: true,
  showWhatsapp: true,
  showPhoto: true,
  allowDiscovery: true,
  allowOfflineSharing: true,
}

/**
 * The mobile app builds offline payloads in `utils/offlinePayload.ts` using a
 * hand-rolled base64url encoder, and the server parses them in
 * `qr.service.ts`. Nothing enforces that the two stay in sync, so this suite
 * pins the wire format from the server side.
 */
function clientStylePayload(deviceKeyId?: string): { body: string; signedMessage: string } {
  const data: Record<string, unknown> = {
    v: 2,
    uid: user.id,
    n: user.name,
    ts: 1_767_225_600_000,
  }
  if (deviceKeyId) data.kid = deviceKeyId
  data.ph = user.phone
  data.wa = user.whatsapp
  data.t = undefined
  data.e = user.email
  data.b = user.bio

  const plain = JSON.stringify(data)
  // Matches the client's B64 alphabet encoding of a UTF-8 string.
  const encoded = Buffer.from(plain, 'utf8').toString('base64url')
  return { body: `connectqr://offline/v2/${encoded}`, signedMessage: plain }
}

describe('offline payload wire format (server side)', () => {
  let service: QrService
  let signing: SigningService
  let keys: { findById: jest.Mock }

  beforeEach(() => {
    keys = { findById: jest.fn() }
    signing = new SigningService()
    service = new QrService(signing as never, keys as never, undefined as never, {
      track: jest.fn().mockResolvedValue(undefined),
    } as never)
  })

  it('accepts a client-built payload and reads every field', async () => {
    const { body } = clientStylePayload('dk_1')
    keys.findById.mockRejectedValue(new Error('not found'))

    const result = await service.parseScannedPayload(`${body}.`)
    expect(result.contact.name).toBe('Ada Lovelace')
    expect(result.contact.phone).toBe('+256700999888')
    expect(result.contact.whatsapp).toBe('+256700999888')
    expect(result.contact.email).toBe('ada@example.com')
  })

  it('accepts an unsigned payload with no signature separator', async () => {
    const { body } = clientStylePayload()
    keys.findById.mockRejectedValue(new Error('not found'))

    const result = await service.parseScannedPayload(body)
    expect(result.contact.name).toBe('Ada Lovelace')
    expect(result.contact.phone).toBe('+256700999888')
    expect(result.trust).toBe('unverified')
  })

  it('still rejects a payload whose body is not decodable', async () => {
    keys.findById.mockRejectedValue(new Error('not found'))

    const result = await service.parseScannedPayload('connectqr://offline/v2/not-base64-json')
    expect(result.contact.name).toBe('Unparseable offline code')
    expect(result.trust).toBe('tampered')
  })

  it('verifies a signature produced over the exact client-encoded body', async () => {
    const { body, signedMessage } = clientStylePayload('dk_1')
    const signature = signing.signWithPem(signedMessage, keyPair.privateKeyPem)
    keys.findById.mockResolvedValue({
      id: 'dk_1',
      publicKey: keyPair.publicKeyB64url,
      status: 'active',
    } satisfies Partial<DeviceKey>)

    const result = await service.parseScannedPayload(`${body}.${signature}`)
    expect(result.trust).toBe('verified')
  })

  it('produces a payload the client can decode back to the same contact', async () => {
    const server = await service.buildOfflinePayload(user, privacy, 'dk_1')
    const encoded = server.slice('connectqr://offline/v2/'.length).split('.')[0]
    const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))

    expect(decoded.v).toBe(2)
    expect(decoded.uid).toBe(user.id)
    expect(decoded.n).toBe(user.name)
    expect(decoded.kid).toBe('dk_1')
    expect(decoded.ph).toBe(user.phone)
  })

  it('keeps base64url free of characters that would break the prefix split', async () => {
    const payload = await service.buildOfflinePayload(user, privacy)
    const encoded = payload.slice('connectqr://offline/v2/'.length).split('.')[0]
    // Only the base64url alphabet may appear, or the '.' split would be unsafe.
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/)
  })
})
