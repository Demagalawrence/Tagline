/**
 * vCard (RFC 6350 / v2.1) and MECARD parsing plus generation.
 *
 * This is the interoperability layer: the contact QR codes that phones and other
 * apps actually produce are overwhelmingly vCard or MECARD, not a bespoke
 * format. Without this, scanning a colleague's standard contact QR landed in
 * the app's generic "unknown" bucket.
 */

export interface ParsedContact {
  name: string
  phone: string
  whatsapp: string
  email?: string
  organization?: string
  title?: string
  url?: string
  address?: string
  note?: string
  avatar?: string
}

const isVCard = (raw: string): boolean => /^BEGIN:VCARD/im.test(raw)
const isMeCard = (raw: string): boolean => /^MECARD:/i.test(raw.trim())

/** Undoes vCard escaping: `\,` `\;` `\n` `\\`. */
function unescapeVCardValue(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim()
}

interface VCardField {
  key: string
  params: string[]
  value: string
}

/** Splits a vCard body into unfolded fields, preserving TYPE parameters. */
function vCardFields(raw: string): VCardField[] {
  // RFC 6350 line folding: a line starting with a space or tab continues the
  // Folded lines use CRLF + one whitespace, and unfolding removes both. A
  // producer that wants a word boundary kept folds with two spaces, since the
  // second survives the unfold.
  const unfolded = raw.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '')
  const fields: VCardField[] = []

  for (const line of unfolded.split(/\r\n|\n|\r/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('BEGIN:') || trimmed.startsWith('END:')) continue
    const colon = trimmed.indexOf(':')
    if (colon <= 0) continue
    const segments = trimmed.slice(0, colon).split(';')
    fields.push({
      key: segments[0].trim().toUpperCase(),
      params: segments.slice(1).map((s) => s.trim().toUpperCase()),
      value: trimmed.slice(colon + 1),
    })
  }
  return fields
}

const byKey = (fields: VCardField[], key: string): VCardField[] =>
  fields.filter((f) => f.key === key)

const first = (fields: VCardField[], key: string): string | undefined => {
  const match = fields.find((f) => f.key === key)
  return match ? match.value : undefined
}

/** Extracts a vCard `PHOTO` value as a data URI or URL when present. */
function vCardPhoto(fields: VCardField[]): string | undefined {
  for (const key of ['PHOTO', 'LOGO']) {
    const match = first(fields, key)
    if (!match) continue
    if (/^data:image\//i.test(match)) return match
    if (/^https?:\/\//i.test(match)) return match
  }
  return undefined
}

/** Builds a display name from vCard structured name (N) or FN. */
function vCardName(fields: VCardField[]): string {
  const fn = first(fields, 'FN')
  if (fn) return unescapeVCardValue(fn)

  const n = first(fields, 'N')
  if (n) {
    // N is Family;Given;Additional;Prefix;Suffix. `additional` is conventionally
    // the middle name, so include it rather than dropping it.
    const [family = '', given = '', additional = '', prefix = '', suffix = ''] = n.split(';')
    const parts = [prefix, given, additional, family, suffix]
      .map((p) => unescapeVCardValue(p))
      .filter(Boolean)
    if (parts.length) return parts.join(' ')
  }
  return 'Unknown contact'
}

export function parseVCard(raw: string): ParsedContact | null {
  if (!isVCard(raw)) return null

  // A payload can hold several vCards; merge the first usable one.
  const blocks = raw.split(/BEGIN:VCARD/i).slice(1)
  for (const block of blocks) {
    const fields = vCardFields(block)
    if (!fields.length) continue

    const name = vCardName(fields)
    if (!name) continue

    // Prefer a CELL/WHATSAPP number, since that is the one the user can act on.
    const tels = byKey(fields, 'TEL').map((f) => ({
      value: unescapeVCardValue(f.value),
      isCell: f.params.some((p) => p.includes('CELL')),
    }))
    const primary = tels.find((t) => t.isCell && t.value) ?? tels.find((t) => t.value)

    return {
      name,
      phone: primary?.value ?? '',
      whatsapp: primary?.value ?? '',
      email: first(fields, 'EMAIL') ? unescapeVCardValue(first(fields, 'EMAIL')!) : undefined,
      organization: first(fields, 'ORG')
        ? unescapeVCardValue(first(fields, 'ORG')!.split(';').pop() ?? '')
        : undefined,
      title: first(fields, 'TITLE') ? unescapeVCardValue(first(fields, 'TITLE')!) : undefined,
      url: first(fields, 'URL') ? unescapeVCardValue(first(fields, 'URL')!) : undefined,
      address: first(fields, 'ADR')
        ? unescapeVCardValue(first(fields, 'ADR')!.split(';').filter(Boolean).join(', '))
        : undefined,
      note: first(fields, 'NOTE') ? unescapeVCardValue(first(fields, 'NOTE')!) : undefined,
      avatar: vCardPhoto(fields),
    }
  }
  return null
}

export function parseMeCard(raw: string): ParsedContact | null {
  const trimmed = raw.trim()
  if (!isMeCard(trimmed)) return null

  const body = trimmed.slice(trimmed.indexOf(':') + 1)
  const fields = new Map<string, string[]>()
  // MECARD separates fields with ';' and name/value with ':'
  for (const part of body.split(';')) {
    const colon = part.indexOf(':')
    if (colon <= 0) continue
    const key = part.slice(0, colon).trim().toUpperCase()
    const value = part.slice(colon + 1)
    const list = fields.get(key) ?? []
    list.push(value)
    fields.set(key, list)
  }

  const get = (key: string): string | undefined => {
    const list = fields.get(key)
    return list && list.length ? list[0]?.trim() : undefined
  }

  const name = get('N') || 'Unknown contact'
  const phone = get('TEL') ?? ''
  return {
    name,
    phone,
    whatsapp: phone,
    email: get('EMAIL'),
    note: get('NOTE'),
    address: get('ADR'),
  }
}

export function parseContactPayload(raw: string): ParsedContact | null {
  if (isVCard(raw)) return parseVCard(raw)
  if (isMeCard(raw)) return parseMeCard(raw)
  return null
}

const escapeVCardValue = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')

export interface VCardInput {
  name: string
  phone?: string
  whatsapp?: string
  email?: string
  organization?: string
  title?: string
  url?: string
  note?: string
}

/**
 * Emits vCard 3.0, the variant with the broadest reader support
 * (iOS, Android, Outlook, and most web-based scanners).
 */
export function buildVCard(input: VCardInput): string {
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0']

  const nameParts = input.name.trim().split(/\s+/)
  const given = nameParts.slice(0, -1).join(' ')
  const family = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''
  lines.push(`N:${escapeVCardValue(family)};${escapeVCardValue(given)};;;`)
  lines.push(`FN:${escapeVCardValue(input.name.trim())}`)

  if (input.phone) lines.push(`TEL;TYPE=CELL,VOICE:${escapeVCardValue(input.phone)}`)
  if (input.whatsapp && input.whatsapp !== input.phone) {
    lines.push(`TEL;TYPE=CELL:${escapeVCardValue(input.whatsapp)}`)
  }
  if (input.email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCardValue(input.email)}`)
  if (input.organization) lines.push(`ORG:${escapeVCardValue(input.organization)}`)
  if (input.title) lines.push(`TITLE:${escapeVCardValue(input.title)}`)
  if (input.url) lines.push(`URL:${escapeVCardValue(input.url)}`)
  if (input.note) lines.push(`NOTE:${escapeVCardValue(input.note)}`)

  lines.push('END:VCARD')
  return lines.join('\r\n')
}

/** MECARD is far more compact than vCard, which matters for QR density limits. */
export function buildMeCard(input: VCardInput): string {
  const parts: string[] = [`N:${input.name.trim()}`]
  if (input.phone) parts.push(`TEL:${input.phone}`)
  if (input.email) parts.push(`EMAIL:${input.email}`)
  if (input.note) parts.push(`NOTE:${input.note}`)
  return `MECARD:${parts.join(';')};;`
}
