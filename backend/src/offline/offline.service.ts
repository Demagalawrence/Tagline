import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { OfflineSession as OfflineSessionEntity } from '../entities/offline-session.entity';
import { OfflineSession } from '../common/types';
import { ConnectionsService } from '../connections/connections.service';

@Injectable()
export class OfflineService {
  constructor(
    @InjectRepository(OfflineSessionEntity) private sessions: Repository<OfflineSessionEntity>,
    private connections: ConnectionsService,
  ) {}

  async startSession(userId: string): Promise<OfflineSession> {
    await this.sessions.delete({ userId });

    const peers = await this.connections.getNearbyDevices(userId);
    const entity = this.sessions.create({
      id: `sess_${uuid()}`,
      userId,
      networkName: 'ConnectQR-Local',
      sessionToken: uuid(),
      expiresInSeconds: 900,
      isSharing: true,
      connectedDevicesJson: JSON.stringify(peers),
    });
    const saved = await this.sessions.save(entity);
    return saved.toDto();
  }

  async stopSession(userId: string): Promise<boolean> {
    const result = await this.sessions.delete({ userId });
    return (result.affected ?? 0) > 0;
  }

  async getSession(userId: string): Promise<OfflineSession | null> {
    const session = await this.sessions.findOneBy({ userId });
    return session ? session.toDto() : null;
  }
}