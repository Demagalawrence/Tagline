import { Platform, Share } from 'react-native'
import { ScannedContact } from '@/types'

/**
 * Builds a standards-compliant vCard 3.0 string from a scanned contact so it can
 * be shared as a file that every phone's address book understands.
 */
export function buildVCard(contact: ScannedContact): string {
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0']
  const fullName = contact.name.trim() || 'Unknown Contact'

  lines.push(`N:${escapeVCard(lastName(fullName))};${escapeVCard(firstName(fullName))};;;`)
  lines.push(`FN:${escapeVCard(fullName)}`)

  if (contact.company) lines.push(`ORG:${escapeVCard(contact.company)}`)
  if (contact.title) lines.push(`TITLE:${escapeVCard(contact.title)}`)
  if (contact.email) lines.push(`EMAIL;type=INTERNET:${escapeVCard(contact.email)}`)
  if (contact.phone) lines.push(`TEL;type=CELL:${escapeVCard(contact.phone)}`)
  if (contact.whatsapp && contact.whatsapp !== contact.phone) {
    lines.push(`TEL;type=CELL:${escapeVCard(contact.whatsapp)}`)
  }
  if (contact.bio) lines.push(`NOTE:${escapeVCard(contact.bio)}`)
  lines.push(`X-CQ-SCAN-TYPE:${escapeVCard(contact.type)}`)
  lines.push('END:VCARD')
  return lines.join('\r\n')
}

function firstName(full: string): string {
  const parts = full.split(/\s+/).filter(Boolean)
  return parts.length > 1 ? parts.slice(0, -1).join(' ') : full
}

function lastName(full: string): string {
  const parts = full.split(/\s+/).filter(Boolean)
  return parts.length > 1 ? parts[parts.length - 1] : ''
}

function escapeVCard(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\r?\n/g, '\\n')
}

/**
 * Shares the contact as a .vcf file where possible (so the receiving app can
 * import it directly), falling back to plain-text sharing when the native share
 * file APIs are unavailable (e.g. web).
 */
export async function shareContactAsVCard(contact: ScannedContact): Promise<void> {
  const vcard = buildVCard(contact)
  const fileName = `${(contact.name || 'contact').replace(/[^a-z0-9]+/gi, '_')}.vcf`

  try {
    const FS = await import('expo-file-system')
    const Sharing = await import('expo-sharing')
    const file = new FS.File(FS.Paths.cache, fileName)
    // overwrite so re-sharing after an edit does not throw.
    file.create({ overwrite: true })
    file.write(vcard)
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/vcard',
      dialogTitle: `Share ${contact.name}`,
      UTI: 'public.vcard',
    })
    return
  } catch {
    // Fall through to text share below (e.g. on web, where File/Sharing are absent).
  }

  await Share.share({
    title: contact.name,
    message: Platform.OS === 'android' ? vcard : `${contact.name}\n\n${vcard}`,
  })
}
