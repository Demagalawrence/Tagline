import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { OfflineSession, NearbyDevice } from '../common/types';
import { ConnectionsService } from '../connections/connections.service';

@Injectable()
export class OfflineService {
  private sessions = new Map<string, OfflineSession>();

  constructor(private connections: ConnectionsService) {}

  async startSession(userId: string): Promise<OfflineSession> {
    const peers = await this.connections.getNearbyDevices(userId);
    const session: OfflineSession = {
      id: `sess_${uuid()}`,
      networkName: 'ConnectQR-Local',
      sessionToken: uuid(),
      expiresInSeconds: 900,
      isSharing: true,
      connectedDevices: peers,
    };
    this.sessions.set(userId, session);
    return session;
  }

  async stopSession(userId: string): Promise<boolean> {
    this.sessions.delete(userId);
    return true;
  }

  async getSession(userId: string): Promise<OfflineSession | null> {
    return this.sessions.get(userId) ?? null;
  }
}
