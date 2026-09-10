import * as Linking from 'expo-linking';
import { digitsOnly } from '@/utils/phone';

export type WhatsAppResult =
  | { status: 'opened' }
  | { status: 'not-installed' }
  | { status: 'invalid-number' }
  | { status: 'cancelled' }
  | { status: 'error' };

export interface WhatsAppService {
  openChat(whatsappNumber: string): Promise<WhatsAppResult>;
  isAvailable(): Promise<boolean>;
}

export class ExpoWhatsAppService implements WhatsAppService {
  async isAvailable(): Promise<boolean> {
    return Linking.canOpenURL('https://wa.me/1');
  }

  async openChat(whatsappNumber: string): Promise<WhatsAppResult> {
    const digits = digitsOnly(whatsappNumber);
    if (digits.length < 8 || digits.length > 15) {
      return { status: 'invalid-number' };
    }

    const url = `https://wa.me/${digits}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        return { status: 'not-installed' };
      }
      await Linking.openURL(url);
      return { status: 'opened' };
    } catch {
      return { status: 'error' };
    }
  }
}

export const whatsappService: WhatsAppService = new ExpoWhatsAppService();
