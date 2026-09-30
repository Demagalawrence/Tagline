import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm'
import { v4 as uuid } from 'uuid'

/**
 * Device public keys used to verify offline contact payloads.
 *
 * Each device generates an Ed25519 keypair on first run. The private seed never
 * leaves the device (SecureStore); only the public key is registered here. An
 * offline payload is signed with the private key, so a payload can only be
 * attributed to a device whose public key is registered. This is what replaces
 * the old shared app key, which shipped inside the client and was therefore
 * forgeable by anyone who unpacked the APK.
 */
@Entity('device_keys')
export class DeviceKey {
  @PrimaryColumn()
  id: string

  @Index()
  @Column()
  userId: string

  /** Base64url-encoded 32-byte Ed25519 public key. */
  @Column()
  publicKey: string

  @Column({ default: 'active' })
  status: 'active' | 'revoked'

  @Column({ default: '' })
  label: string

  @CreateDateColumn()
  createdAt: Date

  static create(userId: string, publicKey: string, label = ''): DeviceKey {
    const key = new DeviceKey()
    key.id = `dk_${uuid()}`
    key.userId = userId
    key.publicKey = publicKey
    key.status = 'active'
    key.label = label
    return key
  }

  toDto() {
    return {
      id: this.id,
      userId: this.userId,
      publicKey: this.publicKey,
      status: this.status,
      label: this.label,
      createdAt:
        this.createdAt instanceof Date ? this.createdAt.toISOString() : String(this.createdAt),
    }
  }
}
