import { getNetworkStateAsync, NetworkStateType } from 'expo-network';
import type { NetworkStatus } from '@/types';

export interface NetworkStateInfo {
  status: NetworkStatus;
  isConnected: boolean;
  isInternetReachable: boolean | null;
}

export interface NetworkService {
  getState(): Promise<NetworkStateInfo>;
}

export class ExpoNetworkService implements NetworkService {
  async getState(): Promise<NetworkStateInfo> {
    try {
      const state = await getNetworkStateAsync();
      const status: NetworkStatus =
        state.type === NetworkStateType.WIFI
          ? 'wifi'
          : state.type === NetworkStateType.CELLULAR
            ? 'cellular'
            : state.type === NetworkStateType.NONE
              ? 'none'
              : 'unknown';

      return {
        status,
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? null,
      };
    } catch {
      return { status: 'unknown', isConnected: false, isInternetReachable: null };
    }
  }
}

export const networkService: NetworkService = new ExpoNetworkService();
