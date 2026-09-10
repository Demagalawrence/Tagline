import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { ScannedContact, NearbyDevice } from '../common/types';

@Injectable()
export class ConnectionsService {
  private connections = new Map<string, ScannedContact[]>();

  async getRecent(userId: string): Promise<ScannedContact[]> {
    return this.connections.get(userId) ?? [];
  }

  async save(userId: string, contact: ScannedContact): Promise<ScannedContact> {
    const saved: ScannedContact = {
      ...contact,
      id: contact.id || `conn_${uuid()}`,
      scannedAt: new Date().toISOString(),
    };
    const list = this.connections.get(userId) ?? [];
    this.connections.set(userId, [saved, ...list.filter((c) => c.id !== saved.id)]);
    return saved;
  }

  async delete(userId: string, contactId: string): Promise<boolean> {
    const list = this.connections.get(userId) ?? [];
    this.connections.set(userId, list.filter((c) => c.id !== contactId));
    return true;
  }

  async getNearbyDevices(userId: string): Promise<NearbyDevice[]> {
    const list = this.connections.get(userId) ?? [];
    return list
      .filter((c) => c.type === 'offline')
      .map((c) => ({
        id: `peer_${c.id}`,
        name: c.name,
        phone: c.phone || c.whatsapp || 'Offline peer',
        avatar: c.avatar,
        status: 'waiting' as const,
        signalStrength: 100,
        lastSeen: c.scannedAt,
      }));
  }
}
