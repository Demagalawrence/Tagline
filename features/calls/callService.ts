import * as Linking from 'expo-linking';
import { digitsOnly } from '@/utils/phone';

export type CallResult =
  | { status: 'opened' }
  | { status: 'not-supported' }
  | { status: 'invalid-number' }
  | { status: 'error' };

export interface CallService {
  openDialer(phoneNumber: string): Promise<CallResult>;
  isSupported(): Promise<boolean>;
}

export class ExpoCallService implements CallService {
  async isSupported(): Promise<boolean> {
    return Linking.canOpenURL('tel:123');
  }

  async openDialer(phoneNumber: string): Promise<CallResult> {
    const digits = digitsOnly(phoneNumber);
    if (digits.length < 7) {
      return { status: 'invalid-number' };
    }

    const url = `tel:${digits}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        return { status: 'not-supported' };
      }
      await Linking.openURL(url);
      return { status: 'opened' };
    } catch {
      return { status: 'error' };
    }
  }
}

export const callService: CallService = new ExpoCallService();
