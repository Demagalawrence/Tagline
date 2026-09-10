import { create } from 'zustand';
import { ScannedContact } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import * as storage from '@/utils/storage';

interface ScanHistoryState {
  contacts: ScannedContact[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  add: (contact: ScannedContact) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
}

const persist = (contacts: ScannedContact[]) => storage.setItem(STORAGE_KEYS.scanHistory, contacts);

export const useScanHistoryStore = create<ScanHistoryState>((set, get) => ({
  contacts: [],
  isHydrated: false,

  hydrate: async () => {
    const stored = await storage.getItem<ScannedContact[]>(STORAGE_KEYS.scanHistory);
    set({ contacts: stored ?? [], isHydrated: true });
  },

  add: async (contact) => {
    const existing = get().contacts;
    const deduped = existing.filter((c) => !(c.type === 'offline' && contact.type === 'offline' && c.id === contact.id));
    const next = [contact, ...deduped];
    set({ contacts: next });
    await persist(next);
  },

  remove: async (id) => {
    const next = get().contacts.filter((c) => c.id !== id);
    set({ contacts: next });
    await persist(next);
  },

  clear: async () => {
    set({ contacts: [] });
    await persist([]);
  },
}));
