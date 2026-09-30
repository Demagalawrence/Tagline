import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../entities/user.entity'
import { Connection } from '../entities/connection.entity'
import { OfflineSession } from '../entities/offline-session.entity'
import { DeviceKey } from '../entities/device-key.entity'

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Connection) private connections: Repository<Connection>,
    @InjectRepository(OfflineSession) private sessions: Repository<OfflineSession>,
    @InjectRepository(DeviceKey) private deviceKeys: Repository<DeviceKey>,
  ) {}

  /**
   * Full account export. Kept synchronous and explicit so what a user gets is
   * obvious: their profile, privacy settings, connections, and device keys.
   */
  async exportData(userId: string) {
    const user = await this.users.findOneBy({ id: userId })
    if (!user) throw new NotFoundException('User not found')

    const [connections, sessions, deviceKeys] = await Promise.all([
      this.connections.find({ where: { userId } }),
      this.sessions.find({ where: { userId } }),
      this.deviceKeys.find({ where: { userId } }),
    ])

    return {
      exportedAt: new Date().toISOString(),
      profile: user.toProfile(),
      privacy: user.toPrivacy(),
      connections: connections.map((c) => c.toContact()),
      offlineSessions: sessions.map((s) => s.toDto()),
      deviceKeys: deviceKeys.map((k) => k.toDto()),
    }
  }

  /**
   * Irreversible account deletion. Connections cascade manually because they
   * reference the user by a plain string rather than a foreign key, and the
   * order matters: dependent rows go first so we never leave orphans behind
   * even if the user row delete fails.
   */
  async deleteAccount(userId: string): Promise<{ deleted: boolean }> {
    const user = await this.users.findOneBy({ id: userId })
    if (!user) throw new NotFoundException('User not found')

    await this.connections.delete({ userId })
    await this.sessions.delete({ userId })
    await this.deviceKeys.delete({ userId })
    await this.users.delete({ id: userId })

    return { deleted: true }
  }
}
