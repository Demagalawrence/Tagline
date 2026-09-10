import { PrivacySettings, QRType, ScannedContact, UserProfile } from '../types';
import { createOfflinePayload, isOfflinePayload, parseOfflinePayload } from '../utils/offlinePayload';

export interface GenerateOptions {
  privacy?: PrivacySettings;
}

export interface QRService {
  generatePayload(user: UserProfile, type: 'profile' | 'whatsapp', options?: GenerateOptions): string;
  generatePayload(user: UserProfile, type: 'offline', options?: GenerateOptions): Promise<string>;
  generatePayload(user: UserProfile, type: QRType, options?: GenerateOptions): Promise<string> | string;
  parseScannedPayload(raw: string): Promise<Partial<ScannedContact>>;
}

export class MockQRService implements QRService {
  generatePayload(user: UserProfile, type: 'profile' | 'whatsapp', options?: GenerateOptions): string;
  generatePayload(user: UserProfile, type: 'offline', options?: GenerateOptions): Promise<string>;
  generatePayload(user: UserProfile, type: QRType, options?: GenerateOptions): Promise<string> | string;
  generatePayload(user: UserProfile, type: QRType, options?: GenerateOptions): Promise<string> | string {
    const cleanPhone = user.whatsapp.replace(/[^\d]/g, '');
    switch (type) {
      case 'whatsapp':
        return `https://wa.me/${cleanPhone}`;
      case 'profile': {
        const slug = user.name.toLowerCase().replace(/\s+/g, '-');
        return `https://connectqr.app/u/${slug || 'profile'}`;
      }
      case 'offline':
        return createOfflinePayload(user, options?.privacy);
      default:
        return `https://connectqr.app/u/${user.id}`;
    }
  }

  async parseScannedPayload(raw: string): Promise<Partial<ScannedContact>> {
    const trimmed = raw.trim();

    if (isOfflinePayload(trimmed)) {
      const result = await parseOfflinePayload(trimmed);
      if (result.ok) {
        return result.contact;
      }
      return {
        name: 'Unverified Offline Code',
        phone: '',
        whatsapp: '',
        bio: result.reason === 'tampered' ? 'This offline code failed its integrity check and was rejected.' : 'This offline code could not be decoded.',
        type: 'unknown',
        rawPayload: trimmed,
      };
    }

    if (trimmed.includes('wa.me/')) {
      const match = trimmed.match(/wa\.me\/(\d+)/);
      const phoneDigits = match ? match[1] : '256700000000';
      const formattedPhone = `+${phoneDigits}`;
      return {
        name: `WhatsApp Contact (${formattedPhone.slice(-4)})`,
        phone: formattedPhone,
        whatsapp: formattedPhone,
        title: 'WhatsApp Contact',
        company: 'Scanned via ConnectQR',
        bio: 'Contact scanned directly from WhatsApp QR code.',
        type: 'whatsapp',
        rawPayload: trimmed,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      };
    }

    if (trimmed.includes('connectqr.app/u/') || trimmed.startsWith('connectqr://profile')) {
      const parts = trimmed.split('/u/');
      const handle = parts[1] || 'profile';
      const capitalized = handle.charAt(0).toUpperCase() + handle.slice(1).replace(/-/g, ' ');
      return {
        name: capitalized || 'Scanned ConnectQR User',
        phone: '+256 700 888 999',
        whatsapp: '+256 700 888 999',
        title: 'ConnectQR Member',
        company: 'ConnectQR Network',
        bio: 'Verified ConnectQR digital profile.',
        type: 'profile',
        rawPayload: trimmed,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      };
    }

    if (trimmed.startsWith('connectqr://offline')) {
      return {
        name: 'Offline Peer',
        phone: '+256 777 555 111',
        whatsapp: '+256 777 555 111',
        title: 'Nearby Offline User',
        company: 'Local Wi-Fi Connect',
        bio: 'Connected instantly over ConnectQR local peer network without internet.',
        type: 'offline',
        rawPayload: trimmed,
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
      };
    }

    // Generic fallback for any other text or web link
    return {
      name: 'Scanned Contact',
      phone: '+256 700 000 000',
      whatsapp: '+256 700 000 000',
      title: 'Scanned Profile',
      company: 'External Code',
      bio: `Payload: ${trimmed}`,
      type: 'unknown',
      rawPayload: trimmed,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
    };
  }
}

export const qrService = new MockQRService();
