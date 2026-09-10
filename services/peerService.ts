import { Platform } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import { getIpAddressAsync, isAirplaneModeEnabledAsync } from 'expo-network';

export interface PeerService {
  getLocalIp(): Promise<string | null>;
  isAirplaneMode(): Promise<boolean>;
  openWifiSettings(): Promise<boolean>;
  openHotspotSettings(): Promise<boolean>;
  openAirplaneModeSettings(): Promise<boolean>;
}

class NativePeerService implements PeerService {
  async getLocalIp(): Promise<string | null> {
    try {
      const ip = await getIpAddressAsync();
      return ip || null;
    } catch {
      return null;
    }
  }

  async isAirplaneMode(): Promise<boolean> {
    try {
      return await isAirplaneModeEnabledAsync();
    } catch {
      return false;
    }
  }

  async openWifiSettings(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    try {
      await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.WIFI_SETTINGS);
      return true;
    } catch {
      return false;
    }
  }

  async openHotspotSettings(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    try {
      await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.WIFI_TETHER_SETTINGS);
      return true;
    } catch {
      return false;
    }
  }

  async openAirplaneModeSettings(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    try {
      await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.AIRPLANE_MODE_SETTINGS);
      return true;
    } catch {
      return false;
    }
  }
}

export const peerService: PeerService = new NativePeerService();
