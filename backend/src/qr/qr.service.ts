import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { UserProfile, PrivacySettings, ScannedContact, QRType } from '../common/types';

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const PAYLOAD_KEY = process.env.OFFLINE_PAYLOAD_KEY || 'connectqr.offline.v1.appkey';

@Injectable()
export class QrService {
  generatePayload(user: UserProfile, type: QRType, privacy?: PrivacySettings): string {
    switch (type) {
      case 'whatsapp': {
        const digits = user.whatsapp.replace(/[^\d]/g, '');
        return `https://wa.me/${digits}`;
      }
      case 'profile': {
        const slug = user.name.toLowerCase().replace(/\s+/g, '-');
        return `https://connectqr.app/u/${slug || 'profile'}`;
      }
      case 'offline':
        return this.buildOfflinePayload(user, privacy ?? {
          showPhone: true, showWhatsapp: true, showPhoto: true,
          allowDiscovery: true, allowOfflineSharing: true,
        });
      default:
        return `https://connectqr.app/u/${user.id}`;
    }
  }

  parseScannedPayload(raw: string): Partial<ScannedContact> {
    const trimmed = raw.trim();

    if (trimmed.startsWith('connectqr://offline/v1/')) {
      return this.parseOfflinePayload(trimmed);
    }
    if (trimmed.includes('wa.me/')) {
      const match = trimmed.match(/wa\.me\/(\d+)/);
      const phone = match ? `+${match[1]}` : '';
      return { name: `WhatsApp Contact (${phone.slice(-4)})`, phone, whatsapp: phone, type: 'whatsapp', rawPayload: trimmed };
    }
    if (trimmed.includes('connectqr.app/u/') || trimmed.startsWith('connectqr://profile')) {
      const parts = trimmed.split('/u/');
      const handle = parts[1] || 'profile';
      const name = handle.charAt(0).toUpperCase() + handle.slice(1).replace(/-/g, ' ');
      return { name, type: 'profile', rawPayload: trimmed };
    }
    return { name: 'Scanned Contact', type: 'unknown', rawPayload: trimmed };
  }

  private buildOfflinePayload(user: UserProfile, privacy: PrivacySettings): string {
    const data: Record<string, any> = { v: 1, uid: user.id, n: user.name.trim() || 'Unknown', ts: Date.now() };
    if (privacy.showPhone && user.phone) data.ph = user.phone;
    if (privacy.showWhatsapp && user.whatsapp) data.wa = user.whatsapp;
    if (privacy.showPhoto && user.avatar) data.a = user.avatar;
    if (user.title) data.t = user.title;
    if (user.company) data.c = user.company;
    if (user.email) data.e = user.email;
    if (user.bio) data.b = user.bio;

    const plain = JSON.stringify(data);
    const sig = this.sign(plain);
    return `connectqr://offline/v1/${this.base64UrlEncode(plain)}.${sig}`;
  }

  private parseOfflinePayload(raw: string): Partial<ScannedContact> {
    const body = raw.slice('connectqr://offline/v1/'.length);
    const dot = body.lastIndexOf('.');
    if (dot <= 0) return { name: 'Malformed offline code', type: 'unknown', rawPayload: raw };

    const encoded = body.slice(0, dot);
    const receivedSig = body.slice(dot + 1);

    try {
      const plain = this.base64UrlDecode(encoded);
      const data = JSON.parse(plain);
      const expectedSig = this.sign(plain);
      if (receivedSig !== expectedSig) {
        return { name: 'Tampered offline code', type: 'unknown', rawPayload: raw };
      }
      return {
        id: `offline_${data.uid}`,
        name: data.n,
        phone: data.ph ?? '',
        whatsapp: data.wa ?? '',
        bio: data.b,
        avatar: data.a,
        title: data.t,
        company: data.c,
        email: data.e,
        scannedAt: new Date(data.ts).toISOString(),
        type: 'offline',
        rawPayload: raw,
      };
    } catch {
      return { name: 'Unparseable offline code', type: 'unknown', rawPayload: raw };
    }
  }

  private sign(plain: string): string {
    return crypto.createHash('sha256').update(`${plain}|${PAYLOAD_KEY}`).digest('base64');
  }

  private base64UrlEncode(str: string): string {
    return Buffer.from(str).toString('base64url');
  }

  private base64UrlDecode(str: string): string {
    return Buffer.from(str, 'base64url').toString('utf8');
  }
}
