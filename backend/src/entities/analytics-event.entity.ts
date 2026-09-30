import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm'
import { v4 as uuid } from 'uuid'

export interface AnalyticsEventDto {
  id: string
  name: string
  properties?: Record<string, unknown>
  platform?: string
  appVersion?: string
  createdAt: string
}

/**
 * Lightweight first-party product analytics. Deliberately event-shaped with a
 * jsonb property bag so new metrics do not require schema changes.
 */
@Entity('analytics_events')
export class AnalyticsEvent {
  @PrimaryColumn()
  id: string

  @Index()
  @Column({ nullable: true })
  userId?: string

  @Index()
  @Column()
  name: string

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  properties: Record<string, unknown>

  @Column({ nullable: true })
  platform?: string

  @Column({ nullable: true })
  appVersion?: string

  @CreateDateColumn()
  createdAt: Date

  static create(input: {
    name: string
    userId?: string
    properties?: Record<string, unknown>
    platform?: string
    appVersion?: string
  }): AnalyticsEvent {
    const event = new AnalyticsEvent()
    event.id = `ev_${uuid()}`
    event.name = input.name
    event.userId = input.userId
    event.properties = input.properties ?? {}
    event.platform = input.platform
    event.appVersion = input.appVersion
    return event
  }

  toDto(): AnalyticsEventDto {
    return {
      id: this.id,
      name: this.name,
      properties: this.properties,
      platform: this.platform,
      appVersion: this.appVersion,
      createdAt:
        this.createdAt instanceof Date ? this.createdAt.toISOString() : String(this.createdAt),
    }
  }
}
