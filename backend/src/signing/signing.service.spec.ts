import {
  SigningService,
  keyPairFromSeed,
  rawPublicKeyToKeyObject,
  keyObjectToRawPublicKey,
} from './signing.service'

/** Deterministic 32-byte seeds so the suite is reproducible. */
const SEED = Buffer.alloc(32, 7).toString('base64url')
const OTHER_SEED = Buffer.alloc(32, 9).toString('base64url')

describe('SigningService', () => {
  let service: SigningService
  let keyPair: ReturnType<typeof keyPairFromSeed>
  let otherPair: ReturnType<typeof keyPairFromSeed>

  beforeEach(() => {
    service = new SigningService()
    keyPair = keyPairFromSeed(SEED)
    otherPair = keyPairFromSeed(OTHER_SEED)
  })

  it('derives the public key matching a private seed', () => {
    expect(service.publicKeyFromPem(keyPair.privateKeyPem)).toBe(keyPair.publicKeyB64url)
  })

  it('round-trips a raw public key through a KeyObject', () => {
    const restored = keyObjectToRawPublicKey(
      rawPublicKeyToKeyObject(keyPair.publicKeyB64url),
    )
    expect(restored).toBe(keyPair.publicKeyB64url)
  })

  it('produces different public keys for different seeds', () => {
    expect(keyPair.publicKeyB64url).not.toBe(otherPair.publicKeyB64url)
  })

  it('accepts a signature produced with the matching key', () => {
    const message = 'connectqr-payload-body'
    const signature = service.signWithPem(message, keyPair.privateKeyPem)

    const verdict = service.verifySignature(message, signature, keyPair.publicKeyB64url)
    expect(verdict.status).toBe('valid')
  })

  it('rejects a signature made by a different key', () => {
    const message = 'connectqr-payload-body'
    const signature = service.signWithPem(message, otherPair.privateKeyPem)

    const verdict = service.verifySignature(message, signature, keyPair.publicKeyB64url)
    expect(verdict.status).toBe('invalid')
  })

  it('rejects a signature over a different message (tampering)', () => {
    const signature = service.signWithPem('original body', keyPair.privateKeyPem)

    const verdict = service.verifySignature('tampered body', signature, keyPair.publicKeyB64url)
    expect(verdict.status).toBe('invalid')
  })

  it('rejects a malformed signature without throwing', () => {
    const verdict = service.verifySignature(
      'body',
      'not-base64url!!',
      keyPair.publicKeyB64url,
    )
    expect(verdict.status).toBe('invalid')
  })

  it('rejects a signature of the wrong length', () => {
    const verdict = service.verifySignature(
      'body',
      Buffer.alloc(16, 1).toString('base64url'),
      keyPair.publicKeyB64url,
    )
    expect(verdict.status).toBe('invalid')
  })

  it('rejects a malformed public key without throwing', () => {
    const signature = service.signWithPem('body', keyPair.privateKeyPem)
    const verdict = service.verifySignature('body', signature, 'garbage-not-a-key')
    expect(verdict.status).toBe('invalid')
  })

  it('produces a 64-byte Ed25519 signature', () => {
    const signature = service.signWithPem('body', keyPair.privateKeyPem)
    expect(Buffer.from(signature, 'base64url')).toHaveLength(64)
  })

  it('is deterministic: same key and message yield the same signature', () => {
    const a = service.signWithPem('body', keyPair.privateKeyPem)
    const b = service.signWithPem('body', keyPair.privateKeyPem)
    expect(a).toBe(b)
  })

  it('handles multi-byte characters in the message', () => {
    const message = JSON.stringify({ n: 'Ada Lovelace — 数学 🔐' })
    const signature = service.signWithPem(message, keyPair.privateKeyPem)
    const verdict = service.verifySignature(message, signature, keyPair.publicKeyB64url)
    expect(verdict.status).toBe('valid')
  })

  it('rejects a seed that is not 32 bytes', () => {
    expect(() => keyPairFromSeed(Buffer.alloc(16, 1).toString('base64url'))).toThrow(
      /32 bytes/,
    )
  })
})
