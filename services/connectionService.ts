import * as Crypto from 'expo-crypto';
import { ScannedContact, NearbyDevice, OfflineSession } from '../types';
import { useScanHistoryStore } from '../store/useScanHistoryStore';
import { peerService } from './peerService';

export interface ConnectionService {
  getRecentConnections(): Promise<ScannedContact[]>;
  saveConnection(contact: ScannedContact): Promise<ScannedContact>;
  deleteConnection(id: string): Promise<boolean>;
  getNearbyDevices(): Promise<NearbyDevice[]>;
  startOfflineSession(): Promise<OfflineSession>;
  stopOfflineSession(): Promise<boolean>;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockConnectionService implements ConnectionService {
  async getRecentConnections(): Promise<ScannedContact[]> {
    await delay(200);
    return [...useScanHistoryStore.getState().contacts];
  }

  async saveConnection(contact: ScannedContact): Promise<ScannedContact> {
    await delay(150);
    const newContact = {
      ...contact,
      id: contact.id || `conn_${Date.now()}`,
      scannedAt: new Date().toISOString(),
    };
    await useScanHistoryStore.getState().add(newContact);
    return newContact;
  }

  async deleteConnection(id: string): Promise<boolean> {
    await delay(150);
    await useScanHistoryStore.getState().remove(id);
    return true;
  }

  async getNearbyDevices(): Promise<NearbyDevice[]> {
    await delay(300);
    // Real peers = people you actually exchanged offline contacts with.
    return useScanHistoryStore
      .getState()
      .contacts.filter((c) => c.type === 'offline')
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

  async startOfflineSession(): Promise<OfflineSession> {
    const localIp = await peerService.getLocalIp();
    const token = Crypto.randomUUID();
    const peers = await this.getNearbyDevices();
    return {
      id: `sess_${Date.now()}`,
      networkName: localIp ? `LAN · ${localIp}` : 'ConnectQR-Local',
      sessionToken: token,
      expiresInSeconds: 900, // 15 minutes
      isSharing: true,
      connectedDevices: peers,
    };
  }

  async stopOfflineSession(): Promise<boolean> {
    await delay(100);
    return true;
  }
}

export const connectionService = new MockConnectionService();
