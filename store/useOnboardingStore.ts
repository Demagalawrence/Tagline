import { create } from 'zustand';
import { STORAGE_KEYS } from '@/constants';
import * as storage from '@/utils/storage';

interface OnboardingState {
  isComplete: boolean;
  isHydrated: boolean;
  complete: () => Promise<void>;
  skip: () => Promise<void>;
  reset: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  isComplete: false,
  isHydrated: false,

  complete: async () => {
    set({ isComplete: true });
    await storage.setItem(STORAGE_KEYS.onboardingComplete, true);
  },

  skip: async () => {
    set({ isComplete: true });
    await storage.setItem(STORAGE_KEYS.onboardingComplete, true);
  },

  reset: async () => {
    set({ isComplete: false });
    await storage.removeItem(STORAGE_KEYS.onboardingComplete);
  },

  hydrate: async () => {
    const value = await storage.getItem<boolean>(STORAGE_KEYS.onboardingComplete);
    set({ isComplete: value === true, isHydrated: true });
  },
}));
