import { buildVCard } from '@/features/contacts/vcard'
import { ScannedContact } from '@/types'

const contact: ScannedContact = {
  id: 'conn_1',
  name: 'Alice Banda',
  phone: '+256700111111',
  whatsapp: '+256700222222',
  email: 'alice@example.com',
  title: 'Engineer',
  company: 'Acme, Inc',
  bio: 'Line one\nLine two',
  scannedAt: '2026-01-01T00:00:00.000Z',
  type: 'profile',
  rawPayload: 'x',
}

describe('buildVCard', () => {
  it('emits a valid vCard 3.0 envelope', () => {
    const vcard = buildVCard(contact)
    expect(vcard).toContain('BEGIN:VCARD')
    expect(vcard).toContain('VERSION:3.0')
    expect(vcard).toContain('END:VCARD')
  })

  it('splits the name into first and last', () => {
    const vcard = buildVCard(contact)
    expect(vcard).toContain('FN:Alice Banda')
    expect(vcard).toContain('N:Banda;Alice;;;')
  })

  it('includes title, org, email, and both phone numbers', () => {
    const vcard = buildVCard(contact)
    expect(vcard).toContain('TITLE:Engineer')
    expect(vcard).toContain('ORG:Acme\\, Inc')
    expect(vcard).toContain('EMAIL;type=INTERNET:alice@example.com')
    expect(vcard).toContain('TEL;type=CELL:+256700111111')
    expect(vcard).toContain('TEL;type=CELL:+256700222222')
  })

  it('escapes commas, semicolons, and newlines per the vCard spec', () => {
    const vcard = buildVCard(contact)
    expect(vcard).toContain('NOTE:Line one\\nLine two')
  })

  it('omits the duplicate number when phone equals whatsapp', () => {
    const vcard = buildVCard({ ...contact, whatsapp: contact.phone })
    const telLines = vcard.split('\r\n').filter((l) => l.startsWith('TEL'))
    expect(telLines).toHaveLength(1)
  })
})
