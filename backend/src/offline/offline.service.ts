import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { OfflineSession as OfflineSessionEntity } from '../entities/offline-session.entity'
import { OfflineSession, NearbyDevice } from '../common/types'
import { ConnectionsService } from '../connections/connections.service'

export const SESSION_TTL_SECONDS = 900
const PEER_STALE_AFTER_MS = 45_000

interface PeerRecord extends NearbyDevice {
  lastSeenMs: number
}

@Injectable()
export class OfflineService {
  private readonly logger = new Logger(OfflineService.name)

  /**
   * Live peers announced on the local network, keyed by session id.
   *
   * In-memory on purpose: these records describe who is on the same Wi-Fi right
   * now. Persisting them would leave stale rows describing devices that have
   * long since left. The database still holds the durable session record.
   */
  private readonly livePeers = new Map<string, Map<string, PeerRecord>>()

  constructor(
    @InjectRepository(OfflineSessionEntity)
    private sessions: Repository<OfflineSessionEntity>,
    private connections: ConnectionsService,
  ) {}

  async startSession(userId: string, networkName?: string): Promise<OfflineSession> {
    await this.sessions.delete({ userId })

    // Seed with peers from previous offline exchanges so a returning device is
    // not starting from a blank list.
    const known = await this.connections.getNearbyDevices(userId)
    const peers = known.map((p) => ({ ...p, lastSeenMs: Date.now() }))
    this.livePeers.set(userId, new Map(peers.map((p) => [p.id, p])))

    const entity = this.sessions.create({
      id: `sess_${uuid()}`,
      userId,
      networkName: networkName?.trim() || 'ConnectQR-Local',
      sessionToken: uuid(),
      expiresInSeconds: SESSION_TTL_SECONDS,
      isSharing: true,
      connectedDevicesJson: '[]',
    })
    const saved = await this.sessions.save(entity)

    return {
      ...saved.toDto(),
      connectedDevices: this.getPeers(userId).map(({ lastSeenMs: _omit, ...p }) => p),
    }
  }

  async stopSession(userId: string): Promise<boolean> {
    this.livePeers.delete(userId)
    const result = await this.sessions.delete({ userId })
    return (result.affected ?? 0) > 0
  }

  async getSession(userId: string): Promise<OfflineSession | null> {
    const session = await this.sessions.findOneBy({ userId })
    if (!session) return null

    const peers = this.getPeers(userId)
    // Persist the current peer list so a reconnecting client sees the same view.
    session.connectedDevicesJson = JSON.stringify(
      peers.map(({ lastSeenMs: _omit, ...p }) => p),
    )
    await this.sessions.save(session)

    return { ...session.toDto(), connectedDevices: peers.map(({ lastSeenMs: _omit, ...p }) => p) }
  }

  /**
   * A device sharing on the LAN announces itself. `sessionToken` is the value the
   * host displayed, so a wrong token is rejected instead of silently accepted.
   */
  async announcePeer(
    userId: string,
    input: { name: string; phone?: string; sessionToken: string; avatar?: string },
  ): Promise<NearbyDevice> {
    const session = await this.sessions.findOneBy({ userId })
    if (!session) throw new BadRequestException('No active offline session')
    if (session.sessionToken !== input.sessionToken) {
      throw new BadRequestException('Invalid session token')
    }
    if (!session.isSharing) {
      throw new BadRequestException('Sharing is stopped for this session')
    }

    const peer: PeerRecord = {
      id: `peer_${userId}`,
      name: input.name?.trim() || 'Nearby device',
      phone: input.phone ?? '',
      avatar: input.avatar,
      status: 'connected',
      signalStrength: 100,
      lastSeen: new Date().toISOString(),
      lastSeenMs: Date.now(),
    }

    const bucket = this.livePeers.get(userId) ?? new Map<string, PeerRecord>()
    bucket.set(peer.id, peer)
    this.livePeers.set(userId, bucket)

    const { lastSeenMs: _omit, ...dto } = peer
    return dto
  }

  /** Current peers for a user, dropping anything that has gone quiet. */
  getPeers(userId: string): PeerRecord[] {
    const bucket = this.livePeers.get(userId)
    if (!bucket) return []

    const cutoff = Date.now() - PEER_STALE_AFTER_MS
    const live: PeerRecord[] = []
    for (const [id, peer] of bucket) {
      if (peer.lastSeenMs < cutoff) {
        bucket.delete(id)
        continue
      }
      live.push(peer)
    }
    return live
  }

  removePeer(userId: string, peerId: string): boolean {
    const bucket = this.livePeers.get(userId)
    if (!bucket) return false
    return bucket.delete(peerId)
  }
}
