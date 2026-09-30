import { contactIdentity, useScanHistoryStore } from '@/store/useScanHistoryStore'
import { ScannedContact } from '@/types'

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}))

function contact(overrides: Partial<ScannedContact> = {}): ScannedContact {
  return {
    id: 'scan_1',
    name: 'Jane Doe',
    phone: '+256700111111',
    whatsapp: '+256700111111',
    scannedAt: '2026-01-01T00:00:00.000Z',
    type: 'profile',
    rawPayload: 'payload-1',
    ...overrides,
  }
}

describe('contactIdentity', () => {
  it('ignores phone formatting differences', () => {
    const a = contactIdentity(contact({ phone: '+256 700 111 111' }))
    const b = contactIdentity(contact({ phone: '+256700111111' }))
    expect(a).toBe(b)
  })

  it('prefers the phone over the email', () => {
    const id = contactIdentity(contact({ email: 'jane@example.com' }))
    expect(id).toBe('phone:256700111111')
  })

  it('falls back to a lowercased email when there is no phone', () => {
    const a = contactIdentity(contact({ phone: '', whatsapp: '', email: 'Jane@Example.com' }))
    const b = contactIdentity(contact({ phone: '', whatsapp: '', email: 'jane@example.com' }))
    expect(a).toBe(b)
    expect(a.startsWith('email:')).toBe(true)
  })

  it('uses the offline user id when no contact details are shared', () => {
    const id = contactIdentity(
      contact({ id: 'offline_usr_9', type: 'offline', phone: '', whatsapp: '' }),
    )
    expect(id).toBe('uid:usr_9')
  })

  it('keeps two different unnamed contacts apart', () => {
    const a = contactIdentity(contact({ phone: '', whatsapp: '', rawPayload: 'a' }))
    const b = contactIdentity(contact({ phone: '', whatsapp: '', rawPayload: 'b' }))
    expect(a).not.toBe(b)
  })
})

describe('useScanHistoryStore.add', () => {
  beforeEach(async () => {
    useScanHistoryStore.setState({ contacts: [], isHydrated: false })
  })

  it('adds a new contact', async () => {
    await useScanHistoryStore.getState().add(contact())
    expect(useScanHistoryStore.getState().contacts).toHaveLength(1)
  })

  it('replaces a re-scan of the same person instead of duplicating', async () => {
    const store = useScanHistoryStore.getState()
    // The bug: ids are timestamp-based, so a naive id match never deduped.
    await store.add(contact({ id: 'scan_1000' }))
    await store.add(contact({ id: 'scan_2000', scannedAt: '2026-02-02T00:00:00.000Z' }))

    const { contacts } = useScanHistoryStore.getState()
    expect(contacts).toHaveLength(1)
    // The newest scan wins, so the details are up to date.
    expect(contacts[0].id).toBe('scan_2000')
  })

  it('dedupes across different QR formats for the same person', async () => {
    const store = useScanHistoryStore.getState()
    await store.add(contact({ id: 'scan_1', type: 'profile' }))
    await store.add(contact({ id: 'scan_2', type: 'vcard' }))
    await store.add(contact({ id: 'scan_3', type: 'whatsapp' }))

    expect(useScanHistoryStore.getState().contacts).toHaveLength(1)
  })

  it('keeps genuinely different people', async () => {
    const store = useScanHistoryStore.getState()
    await store.add(contact({ id: 'scan_1', phone: '+256700111111' }))
    await store.add(contact({ id: 'scan_2', phone: '+256700222222' }))

    expect(useScanHistoryStore.getState().contacts).toHaveLength(2)
  })

  it('puts the newest contact first', async () => {
    const store = useScanHistoryStore.getState()
    await store.add(contact({ id: 'scan_1', phone: '+256700111111' }))
    await store.add(contact({ id: 'scan_2', phone: '+256700222222' }))

    const { contacts } = useScanHistoryStore.getState()
    expect(contacts[0].id).toBe('scan_2')
  })
})

describe('useScanHistoryStore.remove', () => {
  it('removes by id', async () => {
    const store = useScanHistoryStore.getState()
    await store.add(contact({ id: 'scan_1', phone: '+256700111111' }))
    await store.add(contact({ id: 'scan_2', phone: '+256700222222' }))
    await store.remove('scan_1')

    const { contacts } = useScanHistoryStore.getState()
    expect(contacts).toHaveLength(1)
    expect(contacts[0].id).toBe('scan_2')
  })

  it('clears everything', async () => {
    await useScanHistoryStore.getState().add(contact())
    await useScanHistoryStore.getState().clear()
    expect(useScanHistoryStore.getState().contacts).toHaveLength(0)
  })
})
