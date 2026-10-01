import { Column, Entity, PrimaryColumn } from 'typeorm'
import { UserProfile, PrivacySettings } from '../common/types'

@Entity('users')
export class User {
  @PrimaryColumn()
  id: string

  @Column()
  name: string

  @Column({ unique: true })
  email: string

  @Column({ default: '' })
  phone: string

  @Column({ default: '' })
  whatsapp: string

  @Column({ default: '' })
  bio: string

  @Column({ nullable: true })
  avatar?: string

  @Column({ nullable: true })
  title?: string

  @Column({ nullable: true })
  company?: string

  @Column({ nullable: true })
  location?: string

  @Column({ nullable: true })
  website?: string

  @Column()
  passwordHash: string

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean

  @Column({ nullable: true })
  verificationToken?: string

  @Column({ nullable: true })
  resetToken?: string

  @Column({ type: 'timestamp', nullable: true })
  resetTokenExpiresAt?: Date

  @Column({ type: 'int', default: 0 })
  scanCount: number

  @Column({ type: 'timestamp', nullable: true })
  lastScannedAt?: Date

  @Column({ type: 'boolean', default: true })
  showPhone: boolean

  @Column({ type: 'boolean', default: true })
  showWhatsapp: boolean

  @Column({ type: 'boolean', default: true })
  showPhoto: boolean

  @Column({ type: 'boolean', default: true })
  allowDiscovery: boolean

  @Column({ type: 'boolean', default: true })
  allowOfflineSharing: boolean

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date

  toProfile(): UserProfile {
    return {
      id: this.id,
      name: this.name,
      phone: this.phone,
      whatsapp: this.whatsapp,
      bio: this.bio,
      avatar: this.avatar,
      title: this.title,
      company: this.company,
      email: this.email,
      location: this.location,
      website: this.website,
      emailVerified: this.emailVerified,
      scanCount: this.scanCount,
      lastScannedAt:
        this.lastScannedAt instanceof Date ? this.lastScannedAt.toISOString() : undefined,
      createdAt:
        this.createdAt instanceof Date ? this.createdAt.toISOString() : String(this.createdAt),
    }
  }

  toPrivacy(): PrivacySettings {
    return {
      showPhone: this.showPhone,
      showWhatsapp: this.showWhatsapp,
      showPhoto: this.showPhoto,
      allowDiscovery: this.allowDiscovery,
      allowOfflineSharing: this.allowOfflineSharing,
    }
  }
}
