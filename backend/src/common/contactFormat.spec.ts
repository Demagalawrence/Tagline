import {
  buildMeCard,
  buildVCard,
  parseContactPayload,
  parseMeCard,
  parseVCard,
} from './contactFormat'

describe('contactFormat', () => {
  describe('parseVCard', () => {
    it('parses a standard vCard 3.0 card', () => {
      const raw = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'N:Doe;Jane;;;',
        'FN:Jane Doe',
        'TEL;TYPE=CELL:+256700123456',
        'EMAIL;TYPE=INTERNET:jane@example.com',
        'ORG:Example Ltd',
        'TITLE:Engineer',
        'URL:https://example.com',
        'END:VCARD',
      ].join('\r\n')

      const parsed = parseVCard(raw)
      expect(parsed).not.toBeNull()
      expect(parsed!.name).toBe('Jane Doe')
      expect(parsed!.phone).toBe('+256700123456')
      expect(parsed!.whatsapp).toBe('+256700123456')
      expect(parsed!.email).toBe('jane@example.com')
      expect(parsed!.organization).toBe('Example Ltd')
      expect(parsed!.title).toBe('Engineer')
      expect(parsed!.url).toBe('https://example.com')
    })

    it('builds a name from N when FN is absent', () => {
      const raw = [
        'BEGIN:VCARD',
        'VERSION:4.0',
        'N:Smith;Alex;Q;Dr.;PhD',
        'TEL:+15551234567',
        'END:VCARD',
      ].join('\r\n')

      expect(parseVCard(raw)!.name).toBe('Dr. Alex Q Smith PhD')
    })

    it('prefers a CELL number over other phone types', () => {
      const raw = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'FN:Support Desk',
        'TEL;TYPE=WORK:+15550000000',
        'TEL;TYPE=CELL:+15551111111',
        'END:VCARD',
      ].join('\r\n')

      expect(parseVCard(raw)!.phone).toBe('+15551111111')
    })

    it('unfolds continuation lines, consuming the single fold whitespace', () => {
      // RFC 6350 folding: a CRLF followed by one whitespace marks a fold, and
      // unfolding removes both. Producers that want to keep a word boundary
      // fold with two spaces (covered below).
      const raw =
        'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Long Note\r\n' +
        'NOTE:first part of note\r\n continued here\r\nEND:VCARD'

      expect(parseVCard(raw)!.note).toBe('first part of notecontinued here')
    })

    it('preserves the space when a producer folds with two spaces', () => {
      const raw =
        'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Long Note\r\n' +
        'NOTE:first part of note\r\n  continued here\r\nEND:VCARD'

      expect(parseVCard(raw)!.note).toBe('first part of note continued here')
    })

    it('unescapes escaped separators and newlines', () => {
      const raw = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'FN:Comma\\, Person',
        'NOTE:line one\\nline two',
        'END:VCARD',
      ].join('\r\n')

      const parsed = parseVCard(raw)!
      expect(parsed.name).toBe('Comma, Person')
      expect(parsed.note).toBe('line one\nline two')
    })

    it('returns null for input that is not a vCard', () => {
      expect(parseVCard('just some text')).toBeNull()
    })
  })

  describe('parseMeCard', () => {
    it('parses a MECARD payload', () => {
      const parsed = parseMeCard('MECARD:N:Grace Hopper;TEL:+15550001111;EMAIL:grace@example.com;;')
      expect(parsed).not.toBeNull()
      expect(parsed!.name).toBe('Grace Hopper')
      expect(parsed!.phone).toBe('+15550001111')
      expect(parsed!.email).toBe('grace@example.com')
    })

    it('returns null for non-MECARD input', () => {
      expect(parseMeCard('https://example.com')).toBeNull()
    })
  })

  describe('parseContactPayload', () => {
    it('detects vCard over MECARD', () => {
      expect(
        parseContactPayload('BEGIN:VCARD\r\nVERSION:3.0\r\nFN:A\r\nEND:VCARD')!.name,
      ).toBe('A')
    })

    it('detects MECARD', () => {
      expect(parseContactPayload('MECARD:N:B;TEL:+1555;;;')!.name).toBe('B')
    })

    it('returns null for unsupported formats', () => {
      expect(parseContactPayload('BEGIN:VCALENDAR')).toBeNull()
    })
  })

  describe('buildVCard', () => {
    it('emits a card that round-trips through the parser', () => {
      const card = buildVCard({
        name: 'Ada Lovelace',
        phone: '+256700999888',
        email: 'ada@example.com',
        organization: 'Analytical Engines',
        title: 'Mathematician',
        note: 'First programmer',
      })

      expect(card.startsWith('BEGIN:VCARD')).toBe(true)
      expect(card).toContain('VERSION:3.0')

      const parsed = parseVCard(card)!
      expect(parsed.name).toBe('Ada Lovelace')
      expect(parsed.phone).toBe('+256700999888')
      expect(parsed.email).toBe('ada@example.com')
      expect(parsed.note).toBe('First programmer')
    })

    it('escapes commas so they do not break field parsing', () => {
      const card = buildVCard({ name: 'Smith, John', phone: '+15550000000' })
      expect(card).toContain('FN:Smith\\, John')
      expect(parseVCard(card)!.name).toBe('Smith, John')
    })

    it('omits the WhatsApp entry when it matches the phone', () => {
      const card = buildVCard({
        name: 'Same Numbers',
        phone: '+15550000000',
        whatsapp: '+15550000000',
      })
      const telCount = card.split('\r\n').filter((l) => l.startsWith('TEL')).length
      expect(telCount).toBe(1)
    })
  })

  describe('buildMeCard', () => {
    it('emits a MECARD payload that round-trips', () => {
      const raw = buildMeCard({ name: 'Alan Turing', phone: '+15552223333' })
      expect(raw.startsWith('MECARD:')).toBe(true)
      const parsed = parseMeCard(raw)!
      expect(parsed.name).toBe('Alan Turing')
      expect(parsed.phone).toBe('+15552223333')
    })

    it('is more compact than the equivalent vCard', () => {
      const input = { name: 'Compact Test', phone: '+15550000000', email: 'c@example.com' }
      expect(buildMeCard(input).length).toBeLessThan(buildVCard(input).length)
    })
  })
})
