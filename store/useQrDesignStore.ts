import { create } from 'zustand';
import { QRDesign } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import * as storage from '@/utils/storage';

interface QrDesignState {
  design: QRDesign;
  setDesign: (updates: Partial<QRDesign>) => Promise<void>;
  hydrate: () => Promise<void>;
}

const DEFAULT_DESIGN: QRDesign = {
  fg: '#0F172A',
  includeLogo: true,
  showLabel: true,
};

export const useQrDesignStore = create<QrDesignState>((set) => ({
  design: { ...DEFAULT_DESIGN },
  setDesign: async (updates) => {
    const next = { ...DEFAULT_DESIGN, ...useQrDesignStore.getState().design, ...updates };
    set({ design: next });
    await storage.setItem(STORAGE_KEYS.qrDesign, next);
  },
  hydrate: async () => {
    const stored = await storage.getItem<QRDesign>(STORAGE_KEYS.qrDesign);
    set({ design: { ...DEFAULT_DESIGN, ...stored } });
  },
}));
