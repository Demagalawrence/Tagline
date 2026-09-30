import { Injectable } from '@nestjs/common'
import * as crypto from 'crypto'

export type SignatureVerdict =
  | { status: 'valid' }
  | { status: 'invalid' }
  | { status: 'unverified'; reason: string }

/**
 * Verifies offline contact payload signatures using Node's native Ed25519
 * support (no third-party crypto dependency, and no ESM interop issues).
 *
 * Design note: offline payloads are signed on-device with an Ed25519 private key
 * that never leaves the device, and the matching public key is registered with
 * the server. That keeps Offline Connect usable with no internet, which a
 * server-signs-only scheme could not, while still making forged payloads
 * attributable. A payload whose key id the server does not know is reported as
 * `unverified` rather than trusted, so the UI can label it honestly.
 */
@Injectable()
export class SigningService {
  /**
   * Cryptographically check a signature against a known public key.
   * Pure computation, safe to call with untrusted input.
   */
  verifySignature(
    message: string,
    signatureB64url: string,
    publicKeyB64url: string,
  ): SignatureVerdict {
    let publicKey: crypto.KeyObject
    try {
      publicKey = rawPublicKeyToKeyObject(publicKeyB64url)
    } catch {
      return { status: 'invalid' }
    }

    let signature: Buffer
    try {
      signature = Buffer.from(signatureB64url, 'base64url')
    } catch {
      return { status: 'invalid' }
    }
    if (signature.length !== 64) return { status: 'invalid' }

    try {
      const ok = crypto.verify(
        null,
        Buffer.from(message, 'utf8'),
        publicKey,
        signature,
      )
      return ok ? { status: 'valid' } : { status: 'invalid' }
    } catch {
      return { status: 'invalid' }
    }
  }

  /**
   * Signs with a PEM-encoded Ed25519 private key. Used by the server when it
   * signs on behalf of a user while they are online.
   */
  signWithPem(message: string, privateKeyPem: string): string {
    const signature = crypto.sign(
      null,
      Buffer.from(message, 'utf8'),
      crypto.createPrivateKey(privateKeyPem),
    )
    return signature.toString('base64url')
  }

  /** Extracts the raw 32-byte public key (base64url) from a PEM private key. */
  publicKeyFromPem(privateKeyPem: string): string {
    const publicKey = crypto.createPublicKey(crypto.createPrivateKey(privateKeyPem))
    return keyObjectToRawPublicKey(publicKey)
  }
}

/** JWK x-coordinate for Ed25519 is the raw 32-byte public key. */
export function keyObjectToRawPublicKey(publicKey: crypto.KeyObject): string {
  const jwk = publicKey.export({ format: 'jwk' }) as { x?: string }
  if (!jwk.x) throw new Error('Public key is not an Ed25519 key')
  return jwk.x
}

export function rawPublicKeyToKeyObject(rawB64url: string): crypto.KeyObject {
  return crypto.createPublicKey({
    key: { kty: 'OKP', crv: 'Ed25519', x: rawB64url },
    format: 'jwk',
  })
}

/** Test/tooling helper: derive a keypair from a deterministic 32-byte seed. */
export function keyPairFromSeed(seedB64url: string): {
  seedB64url: string
  publicKeyB64url: string
  privateKeyPem: string
} {
  const seed = Buffer.from(seedB64url, 'base64url')
  if (seed.length !== 32) throw new Error('Seed must be 32 bytes')

  // PKCS8 wrapper for an Ed25519 private key: fixed prefix + 32-byte seed.
  const pkcs8Prefix = Buffer.from('302e020100300506032b657004220420', 'hex')
  const privateKey = crypto.createPrivateKey({
    key: Buffer.concat([pkcs8Prefix, seed]),
    format: 'der',
    type: 'pkcs8',
  })

  const publicKey = crypto.createPublicKey(privateKey)
  return {
    seedB64url,
    publicKeyB64url: keyObjectToRawPublicKey(publicKey),
    privateKeyPem: privateKey.export({ format: 'pem', type: 'pkcs8' }).toString(),
  }
}
