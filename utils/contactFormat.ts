/**
 * Minimal vCard/MECARD reader for the offline path.
 *
 * The server has the authoritative parser (`backend/src/common/contactFormat.ts`).
 * This is the fallback used when a scan happens with no connectivity, so it
 * deliberately supports only what a phone camera can realistically capture:
 * folded lines, TYPE parameters, and escaped separators.
 */

export interface ParsedContact {
  name: string
  phone: string
  whatsapp: string
  email?: string
  organization?: string
  title?: string
  url?: string
  note?: string
  avatar?: string
}

function isVCard(raw: string): boolean {
  return /^\s*BEGIN:VCARD/im.test(raw)
}

function isMeCard(raw: string): boolean {
  return /^\s*MECARD:/i.test(raw)
}

function unescapeValue(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim()
}

/** Unfolds RFC 6350 continuation lines before splitting into fields. */
function unfold(raw: string): string[] {
  return raw
    .replace(/\r\n[ \t]/g, '')
    .replace(/\n[ \t]/g, '')
    .split(/\r\n|\n|\r/)
}

interface VCardField {
  key: string
  params: string[]
  value: string
}

function parseFields(body: string): VCardField[] {
  const fields: VCardField[] = []
  for (const line of unfold(body)) {
    const colon = line.indexOf(':')
    if (colon <= 0) continue
    const segments = line.slice(0, colon).split(';')
    const key = segments[0].replace(/^.*\./, '').trim().toUpperCase()
    if (!key) continue
    fields.push({
      key,
      params: segments.slice(1).map((s) => s.trim().toUpperCase()),
      value: line.slice(colon + 1),
    })
  }
  return fields
}

function first(fields: VCardField[], key: string): string | undefined {
  return fields.find((f) => f.key === key)?.value
}

function buildName(fields: VCardField[]): string {
  const fn = first(fields, 'FN')
  if (fn) return unescapeValue(fn)

  const n = first(fields, 'N')
  if (n) {
    const [family = '', given = '', additional = '', prefix = '', suffix = ''] = n.split(';')
    const parts = [prefix, given, additional, family, suffix].map(unescapeValue).filter(Boolean)
    if (parts.length) return parts.join(' ')
  }
  return 'Unknown contact'
}

/** Prefers a CELL/WA number, then any TEL. */
function pickPhone(fields: VCardField[]): string {
  const tels = fields.filter((f) => f.key === 'TEL' && f.value.trim())
  if (!tels.length) return ''
  const preferred =
    tels.find((t) => t.params.some((p) => p === 'CELL' || p.includes('CELL'))) ??
    tels.find((t) => t.params.some((p) => p.includes('WA') || p.includes('WHATSAPP'))) ??
    tels[0]
  return unescapeValue(preferred.value)
}

export function parseVCard(raw: string): ParsedContact | null {
  if (!isVCard(raw)) return null
  const blocks = raw.split(/BEGIN:VCARD/i).slice(1)
  for (const block of blocks) {
    const fields = parseFields(block.split(/END:VCARD/i)[0])
    if (!fields.length) continue
    const phone = pickPhone(fields)
    const photo = first(fields, 'PHOTO')
    const address = first(fields, 'ADR')
    return {
      name: buildName(fields),
      phone,
      // Only claim WhatsApp when the card actually says so.
      whatsapp: /WHATSAPP/.test(JSON.stringify(fields.map((f) => f.params))) ? phone : '',
      email: first(fields, 'EMAIL') ? unescapeValue(first(fields, 'EMAIL')!) : undefined,
      organization: first(fields, 'ORG')
        ? unescapeValue(first(fields, 'ORG')!.split(';').pop() ?? '')
        : undefined,
      title: first(fields, 'TITLE') ? unescapeValue(first(fields, 'TITLE')!) : undefined,
      url: first(fields, 'URL') ? unescapeValue(first(fields, 'URL')!) : undefined,
      note: first(fields, 'NOTE') ? unescapeValue(first(fields, 'NOTE')!) : undefined,
      avatar: photo && /^https?:\/\//i.test(photo) ? photo : undefined,
      address: address
        ? unescapeValue(address.split(';').filter(Boolean).join(', '))
        : undefined,
    } as ParsedContact & { address?: string }
  }
  return null
}

export function parseMeCard(raw: string): ParsedContact | null {
  if (!isMeCard(raw)) return null
  const body = raw.trim().slice('MECARD:'.length)
  const fields: Record<string, string> = {}
  for (const chunk of body.split(';')) {
    const colon = chunk.indexOf(':')
    if (colon <= 0) continue
    fields[chunk.slice(0, colon).trim().toUpperCase()] = chunk.slice(colon + 1)
  }
  if (!fields.N && !fields.TEL) return null
  const phone = unescapeValue(fields.TEL ?? '')
  return {
    name: fields.N ? unescapeValue(fields.N) : phone || 'Unknown contact',
    phone,
    whatsapp: /WHATSAPP/i.test(fields.N ?? '') ? phone : '',
    email: fields.EMAIL ? unescapeValue(fields.EMAIL) : undefined,
    note: fields.NOTE ? unescapeValue(fields.NOTE) : undefined,
  }
}

export function parseContactPayload(raw: string): ParsedContact | null {
  return parseVCard(raw) ?? parseMeCard(raw)
}

export function isContactFormat(raw: string): boolean {
  return isVCard(raw) || isMeCard(raw)
}
