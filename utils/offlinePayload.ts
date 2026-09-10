import * as Crypto from 'expo-crypto';
import { PrivacySettings, ScannedContact, UserProfile } from '@/types';

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const B64_LOOKUP: Record<string, number> = {};
for (let i = 0; i < B64.length; i++) B64_LOOKUP[B64[i]] = i;

/**
 * Bundled integrity key for offline payloads. A real deployment should replace
 * this with a server-issued key (or full HMAC) once the backend exists; the
 * sign/verify shape below is designed so that swap is isolated here.
 */
const PAYLOAD_KEY = 'connectqr.offline.v1.appkey';

function utf8ToBytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let cp = str.codePointAt(i) ?? 0;
    if (cp > 0xffff) i++;
    if (cp < 0x80) {
      bytes.push(cp);
    } else if (cp < 0x800) {
      bytes.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f));
    } else if (cp < 0x10000) {
      bytes.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    } else {
      bytes.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    }
  }
  return bytes;
}

function bytesToUtf8(bytes: number[]): string {
  let out = '';
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i];
    if (b < 0x80) {
      out += String.fromCharCode(b);
      i += 1;
    } else if (b < 0xe0) {
      out += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i + 1] & 0x3f));
      i += 2;
    } else if (b < 0xf0) {
      out += String.fromCharCode(((b & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f));
      i += 3;
    } else {
      const cp = ((b & 0x07) << 18) | ((bytes[i + 1] & 0x3f) << 12) | ((bytes[i + 2] & 0x3f) << 6) | (bytes[i + 3] & 0x3f);
      out += String.fromCodePoint(cp);
      i += 4;
    }
  }
  return out;
}

function base64UrlEncode(str: string): string {
  const bytes = utf8ToBytes(str);
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    out += B64[a >> 2];
    out += B64[((a & 3) << 4) | (b !== undefined ? b >> 4 : 0)];
    if (b !== undefined) {
      out += B64[((b & 15) << 2) | (c !== undefined ? c >> 6 : 0)];
      if (c !== undefined) out += B64[c & 63];
    }
  }
  return out;
}

function base64UrlDecode(str: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i += 4) {
    const a = B64_LOOKUP[str[i]];
    const b = B64_LOOKUP[str[i + 1]];
    bytes.push((a << 2) | (b >> 4));
    const c = B64_LOOKUP[str[i + 2]];
    if (c !== undefined) {
      bytes.push(((b & 15) << 4) | (c >> 2));
      const d = B64_LOOKUP[str[i + 3]];
      if (d !== undefined) bytes.push(((c & 3) << 6) | d);
    }
  }
  return bytesToUtf8(bytes);
}

interface OfflinePayloadData {
  v: 1;
  uid: string;
  n: string;
  t?: string;
  c?: string;
  e?: string;
  b?: string;
  a?: string;
  ph?: string;
  wa?: string;
  ts: number;
}

export type OfflinePayloadResult =
  | { ok: true; contact: ScannedContact }
  | { ok: false; reason: 'malformed' | 'unsupported' | 'tampered' };

export function isOfflinePayload(raw: string): boolean {
  return raw.trim().startsWith('connectqr://offline/v1/');
}

async function sign(plain: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${plain}|${PAYLOAD_KEY}`, {
    encoding: Crypto.CryptoEncoding.BASE64,
  });
}

async function buildOfflinePayload(profile: UserProfile, privacy: PrivacySettings): Promise<string> {
  const data: OfflinePayloadData = {
    v: 1,
    uid: profile.id,
    n: profile.name.trim() || 'Unknown',
    ts: Date.now(),
  };

  if (privacy.showPhone && profile.phone) data.ph = profile.phone;
  if (privacy.showWhatsapp && profile.whatsapp) data.wa = profile.whatsapp;
  if (privacy.showPhoto && profile.avatar) data.a = profile.avatar;
  if (profile.title) data.t = profile.title;
  if (profile.company) data.c = profile.company;
  if (profile.email) data.e = profile.email;
  if (profile.bio) data.b = profile.bio;

  const plain = JSON.stringify(data);
  const sig = await sign(plain);
  return `connectqr://offline/v1/${base64UrlEncode(plain)}.${sig}`;
}

export async function createOfflinePayload(profile: UserProfile, privacy?: PrivacySettings): Promise<string> {
  const effective: PrivacySettings = privacy ?? { showPhone: true, showWhatsapp: true, showPhoto: true, allowDiscovery: true, allowOfflineSharing: true };
  return buildOfflinePayload(profile, effective);
}

export async function parseOfflinePayload(raw: string): Promise<OfflinePayloadResult> {
  const trimmed = raw.trim();
  if (!isOfflinePayload(trimmed)) {
    return { ok: false, reason: 'malformed' };
  }

  const body = trimmed.slice('connectqr://offline/v1/'.length);
  const dot = body.lastIndexOf('.');
  if (dot <= 0) return { ok: false, reason: 'malformed' };

  const encoded = body.slice(0, dot);
  const receivedSig = body.slice(dot + 1);

  let plain: string;
  let data: OfflinePayloadData;
  try {
    plain = base64UrlDecode(encoded);
    const parsed = JSON.parse(plain) as OfflinePayloadData;
    if (parsed?.v !== 1 || !parsed.uid || !parsed.n) {
      return { ok: false, reason: 'unsupported' };
    }
    data = parsed;
  } catch {
    return { ok: false, reason: 'malformed' };
  }

  const expectedSig = await sign(plain);
  if (receivedSig !== expectedSig) {
    return { ok: false, reason: 'tampered' };
  }

  return {
    ok: true,
    contact: {
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
      rawPayload: trimmed,
    },
  };
}
