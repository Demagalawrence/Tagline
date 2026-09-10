import { create } from 'zustand';
import { NearbyDevice, OfflineSession, OfflineNetworkMode, NetworkStatus } from '@/types';
import { connectionService } from '@/services/connectionService';
import { peerService } from '@/services/peerService';

interface OfflineState {
  mode: OfflineNetworkMode;
  networkStatus: NetworkStatus;
  isSharing: boolean;
  isDiscovering: boolean;
  session: OfflineSession | null;
  devices: NearbyDevice[];
  expiresInSeconds: number;
  localIp: string | null;
  airplaneMode: boolean;
  setNetworkStatus: (status: NetworkStatus) => void;
  setMode: (mode: OfflineNetworkMode) => void;
  refreshNetworkInfo: () => Promise<void>;
  startSharing: () => Promise<void>;
  stopSharing: () => Promise<void>;
  discover: () => Promise<void>;
  tick: () => void;
  reset: () => void;
}

const deriveMode = (status: NetworkStatus, airplaneMode: boolean): OfflineNetworkMode => {
  if (airplaneMode) return 'unsupported';
  switch (status) {
    case 'wifi':
      return 'connected';
    case 'none':
      return 'no-wifi';
    default:
      return 'unsupported';
  }
};

export const useOfflineStore = create<OfflineState>((set, get) => ({
  mode: 'connected',
  networkStatus: 'unknown',
  isSharing: false,
  isDiscovering: false,
  session: null,
  devices: [],
  expiresInSeconds: 900,
  localIp: null,
  airplaneMode: false,

  setNetworkStatus: (status) => {
    set({ networkStatus: status, mode: deriveMode(status, get().airplaneMode) });
  },

  setMode: (mode) => {
    set({ mode });
  },

  refreshNetworkInfo: async () => {
    const [localIp, airplaneMode] = await Promise.all([peerService.getLocalIp(), peerService.isAirplaneMode()]);
    set({ localIp, airplaneMode, mode: deriveMode(get().networkStatus, airplaneMode) });
  },

  startSharing: async () => {
    set({ isSharing: true });
    try {
      await get().refreshNetworkInfo();
      const session = await connectionService.startOfflineSession();
      set({ session, isSharing: false, expiresInSeconds: session.expiresInSeconds });
    } catch {
      set({ isSharing: false });
    }
  },

  stopSharing: async () => {
    set({ isSharing: true });
    try {
      await connectionService.stopOfflineSession();
      set({ session: null, isSharing: false, expiresInSeconds: 0 });
    } catch {
      set({ isSharing: false });
    }
  },

  discover: async () => {
    set({ isDiscovering: true });
    try {
      const devices = await connectionService.getNearbyDevices();
      set({ devices, isDiscovering: false });
    } catch {
      set({ isDiscovering: false });
    }
  },

  tick: () => {
    const current = get().expiresInSeconds;
    if (current <= 0) {
      void get().stopSharing();
      return;
    }
    set({ expiresInSeconds: current - 1 });
  },

  reset: () => {
    set({
      isSharing: false,
      isDiscovering: false,
      session: null,
      devices: [],
      expiresInSeconds: 900,
      localIp: null,
      airplaneMode: false,
    });
  },
}));
