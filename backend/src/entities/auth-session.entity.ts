import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm'
import { AuthSessionInfo } from '../common/types'

/**
 * One row per issued JWT. The token's `jti` claim is the primary key, so the
 * guard can reject a revoked token without waiting for it to expire.
 */
@Entity('auth_sessions')
export class AuthSession {
  @PrimaryColumn()
  id: string

  @Index()
  @Column()
  userId: string

  /** Short label the app sends, e.g. "Pixel 8 (Android)". */
  @Column({ default: 'Unknown device' })
  deviceLabel: string

  @Column({ type: 'text', nullable: true })
  userAgent: string | null

  @Column({ type: 'text', nullable: true })
  ipAddress: string | null

  @CreateDateColumn()
  createdAt: Date

  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt: Date | null

  @Column({ type: 'timestamptz' })
  expiresAt: Date

  /** Set instead of deleting the row, so the audit trail survives. */
  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null

  isActive(now = new Date()): boolean {
    return this.revokedAt === null && this.expiresAt.getTime() > now.getTime()
  }

  toDto(currentSessionId?: string): AuthSessionInfo {
    return {
      id: this.id,
      deviceLabel: this.deviceLabel,
      userAgent: this.userAgent ?? undefined,
      ipAddress: this.ipAddress ?? undefined,
      createdAt: this.createdAt.toISOString(),
      lastUsedAt: this.lastUsedAt ? this.lastUsedAt.toISOString() : undefined,
      expiresAt: this.expiresAt.toISOString(),
      revokedAt: this.revokedAt ? this.revokedAt.toISOString() : undefined,
      isCurrent: this.id === currentSessionId,
      isActive: this.isActive(),
    }
  }
}
