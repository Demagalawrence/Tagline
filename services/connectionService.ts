import * as Crypto from 'expo-crypto'
import { ScannedContact, NearbyDevice, OfflineSession, ActivityFeed } from '../types'
import { useScanHistoryStore } from '../store/useScanHistoryStore'
import { peerService } from './peerService'
import { apiRequest } from './api'

export interface ConnectionService {
  getRecentConnections(): Promise<ScannedContact[]>
  saveConnection(contact: ScannedContact): Promise<ScannedContact>
  deleteConnection(id: string): Promise<boolean>
  getNearbyDevices(): Promise<NearbyDevice[]>
  startOfflineSession(): Promise<OfflineSession>
  stopOfflineSession(): Promise<boolean>
  getActivity(): Promise<ActivityFeed>
}

export class ApiConnectionService implements ConnectionService {
  async getRecentConnections(): Promise<ScannedContact[]> {
    try {
      return await apiRequest<ScannedContact[]>('/api/connections', { auth: true })
    } catch {
      return useScanHistoryStore.getState().contacts
    }
  }

  async saveConnection(contact: ScannedContact): Promise<ScannedContact> {
    try {
      return await apiRequest<ScannedContact>('/api/connections', {
        method: 'POST',
        body: contact,
        auth: true,
      })
    } catch {
      const saved: ScannedContact = {
        ...contact,
        id: contact.id || `conn_${Date.now()}`,
        scannedAt: new Date().toISOString(),
      }
      await useScanHistoryStore.getState().add(saved)
      return saved
    }
  }

  async deleteConnection(id: string): Promise<boolean> {
    try {
      return await apiRequest<boolean>(`/api/connections/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        auth: true,
      })
    } catch {
      await useScanHistoryStore.getState().remove(id)
      return true
    }
  }

  async getNearbyDevices(): Promise<NearbyDevice[]> {
    try {
      return await apiRequest<NearbyDevice[]>('/api/connections/nearby', { auth: true })
    } catch {
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
        }))
    }
  }

  async startOfflineSession(): Promise<OfflineSession> {
    const localIp = await peerService.getLocalIp()
    const peers = await this.getNearbyDevices()
    try {
      const session = await apiRequest<OfflineSession>('/api/offline/start', {
        method: 'POST',
        auth: true,
      })
      return session
    } catch {
      return {
        id: `sess_${Date.now()}`,
        networkName: localIp ? `LAN · ${localIp}` : 'ConnectQR-Local',
        sessionToken: Crypto.randomUUID(),
        expiresInSeconds: 900,
        isSharing: true,
        connectedDevices: peers,
      }
    }
  }

  async getActivity(): Promise<ActivityFeed> {
    try {
      return await apiRequest<ActivityFeed>('/api/connections/activity', { auth: true })
    } catch {
      const connections = await this.getRecentConnections()
      return { connections, account: null }
    }
  }

  async stopOfflineSession(): Promise<boolean> {
    try {
      await apiRequest<boolean>('/api/offline/stop', { method: 'DELETE', auth: true })
    } catch {
      // offline-first: nothing else to clean up locally
    }
    return true
  }
}

export const connectionService: ConnectionService = new ApiConnectionService()
