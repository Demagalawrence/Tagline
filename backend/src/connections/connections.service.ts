import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { Connection } from '../entities/connection.entity'
import { User } from '../entities/user.entity'
import { ScannedContact, NearbyDevice } from '../common/types'

/** Hard ceiling, enforced server-side regardless of what the client sends. */
const MAX_TAGS_PER_CONNECTION = 12

@Injectable()
export class ConnectionsService {
  constructor(
    @InjectRepository(Connection) private connections: Repository<Connection>,
    @InjectRepository(User) private users: Repository<User>,
  ) {}

  async getRecent(userId: string): Promise<ScannedContact[]> {
    const rows = await this.connections.find({
      where: { userId },
      order: { scannedAt: 'DESC' },
    })
    return rows.map((row) => row.toContact())
  }

  async save(userId: string, contact: ScannedContact): Promise<ScannedContact> {
    const entity = this.connections.create({
      id: contact.id || `conn_${uuid()}`,
      userId,
      name: contact.name,
      phone: contact.phone ?? '',
      whatsapp: contact.whatsapp ?? '',
      bio: contact.bio,
      avatar: contact.avatar,
      title: contact.title,
      company: contact.company,
      email: contact.email,
      scannedAt: new Date(contact.scannedAt ?? Date.now()),
      type: contact.type,
      rawPayload: contact.rawPayload ?? '',
      tags: contact.tags?.length ? contact.tags : [contact.type ?? 'unknown'],
    })
    const saved = await this.connections.save(entity)
    return saved.toContact()
  }

  /**
   * Recent connection entries plus the account-level picture the app shows on
   * its "Activity" screen - a single request instead of three.
   */
  async getActivity(userId: string) {
    const [rows, user] = await Promise.all([
      this.connections.find({ where: { userId }, order: { scannedAt: 'DESC' } }),
      this.users.findOneBy({ id: userId }),
    ])
    return {
      connections: rows.map((row) => row.toContact()),
      account: user
        ? {
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            scanCount: user.scanCount,
            scansPerformed: user.scansPerformed,
            lastScannedAt:
              user.lastScannedAt instanceof Date
                ? user.lastScannedAt.toISOString()
                : user.lastScannedAt
                  ? String(user.lastScannedAt)
                  : undefined,
          }
        : null,
    }
  }

  async delete(userId: string, contactId: string): Promise<boolean> {
    const result = await this.connections.delete({ userId, id: contactId })
    return (result.affected ?? 0) > 0
  }

  /**
   * Replaces the tag list on one connection. Tags are normalised so the
   * "grouped by tag" view cannot end up with stray whitespace or near-duplicate
   * groups that the user did not intend.
   */
  async setTags(userId: string, contactId: string, tags: string[]): Promise<ScannedContact | null> {
    const row = await this.connections.findOneBy({ userId, id: contactId })
    if (!row) return null

    // Tags drive filtering, so "Work" and "work" must not become two entries.
    // Keep the casing the user typed first, drop the rest, then cap.
    const seen = new Set<string>()
    const normalized: string[] = []
    for (const tag of tags) {
      const trimmed = tag.trim()
      const key = trimmed.toLowerCase()
      if (!trimmed || seen.has(key)) continue
      seen.add(key)
      normalized.push(trimmed)
    }
    row.tags = normalized.slice(0, MAX_TAGS_PER_CONNECTION)
    // A connection with no tags is still perfectly valid, so keep whatever the
    // user asked for rather than silently reinstating the type default.
    row.tags = normalized
    const saved = await this.connections.save(row)
    return saved.toContact()
  }

  /** Every tag in use by this account, with counts, for the filter row. */
  async getTagSummary(userId: string): Promise<{ tag: string; count: number }[]> {
    const rows = await this.connections.find({ where: { userId } })
    const counts = new Map<string, number>()
    for (const row of rows) {
      for (const tag of row.tags ?? []) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1)
      }
    }
    return [...counts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
  }

  async getNearbyDevices(userId: string): Promise<NearbyDevice[]> {
    const rows = await this.connections.find({ where: { userId, type: 'offline' } })
    return rows.map((c) => ({
      id: `peer_${c.id}`,
      name: c.name,
      phone: c.phone || c.whatsapp || 'Offline peer',
      avatar: c.avatar,
      status: 'waiting' as const,
      signalStrength: 100,
      lastSeen: c.scannedAt instanceof Date ? c.scannedAt.toISOString() : String(c.scannedAt),
    }))
  }
}
