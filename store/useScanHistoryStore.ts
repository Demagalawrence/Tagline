import { create } from 'zustand'
import { ScannedContact } from '@/types'
import { STORAGE_KEYS } from '@/constants'
import * as storage from '@/utils/storage'

interface ScanHistoryState {
  contacts: ScannedContact[]
  isHydrated: boolean
  hydrate: () => Promise<void>
  add: (contact: ScannedContact) => Promise<void>
  remove: (id: string) => Promise<void>
  clear: () => Promise<void>
}

const persist = (contacts: ScannedContact[]) => storage.setItem(STORAGE_KEYS.scanHistory, contacts)

/**
 * Stable identity for a contact, used to recognise repeat scans of the same
 * person.
 *
 * The previous check compared ids, but scan ids are generated from a timestamp,
 * so re-scanning the same person produced a new id every time and the history
 * filled up with duplicates. Comparing the person's actual details - and only
 * falling back to the id when there is nothing better - fixes that.
 *
 * Phone wins over email because it is what people actually use to say "same
 * person". Digits are compared because the same number is often formatted
 * differently between a vCard and a WhatsApp link.
 */
export function contactIdentity(contact: ScannedContact): string {
  const digits = (contact.phone || contact.whatsapp || '').replace(/\D/g, '')
  if (digits.length >= 7) return `phone:${digits}`

  const email = contact.email?.trim().toLowerCase()
  if (email) return `email:${email}`

  // Offline payloads encode the source user id.
  if (contact.type === 'offline' && contact.id.startsWith('offline_')) {
    return `uid:${contact.id.slice('offline_'.length)}`
  }

  // Nothing identifying: treat the raw payload as the identity so two
  // genuinely different unnamed contacts do not collapse into one.
  return `raw:${contact.rawPayload}`
}

function isSameContact(a: ScannedContact, b: ScannedContact): boolean {
  return contactIdentity(a) === contactIdentity(b)
}

export const useScanHistoryStore = create<ScanHistoryState>((set, get) => ({
  contacts: [],
  isHydrated: false,

  hydrate: async () => {
    const stored = await storage.getItem<ScannedContact[]>(STORAGE_KEYS.scanHistory)
    set({ contacts: stored ?? [], isHydrated: true })
  },

  add: async (contact) => {
    const existing = get().contacts
    const deduped = existing.filter((c) => !isSameContact(c, contact))
    // Newest scan first.
    const next = [contact, ...deduped]
    set({ contacts: next })
    await persist(next)
  },

  remove: async (id) => {
    const next = get().contacts.filter((c) => c.id !== id)
    set({ contacts: next })
    await persist(next)
  },

  clear: async () => {
    set({ contacts: [] })
    await persist([])
  },
}))
