import { create } from 'zustand';
import { UserProfile, PrivacySettings } from '@/types';
import { profileService } from '@/services/profileService';
import { MOCK_USER, DEFAULT_PRIVACY_SETTINGS } from '@/mock/user';
import { STORAGE_KEYS } from '@/constants';
import * as storage from '@/utils/storage';

interface ProfileState {
  profile: UserProfile;
  privacy: PrivacySettings;
  isLoading: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  load: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  updatePrivacy: (updates: Partial<PrivacySettings>) => Promise<boolean>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: { ...MOCK_USER },
  privacy: { ...DEFAULT_PRIVACY_SETTINGS },
  isLoading: false,
  isHydrated: false,

  hydrate: async () => {
    const [profile, privacy] = await Promise.all([
      storage.getItem<UserProfile>(STORAGE_KEYS.profile),
      storage.getItem<PrivacySettings>(STORAGE_KEYS.privacy),
    ]);
    set({
      profile: profile ?? { ...MOCK_USER },
      privacy: privacy ?? { ...DEFAULT_PRIVACY_SETTINGS },
      isHydrated: true,
    });
  },

  load: async () => {
    set({ isLoading: true });
    try {
      const [profile, privacy] = await Promise.all([
        profileService.getProfile(),
        profileService.getPrivacySettings(),
      ]);
      set({ profile, privacy });
      await storage.setItem(STORAGE_KEYS.profile, profile);
      await storage.setItem(STORAGE_KEYS.privacy, privacy);
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (updates) => {
    try {
      const next = await profileService.updateProfile(updates);
      set({ profile: next });
      await storage.setItem(STORAGE_KEYS.profile, next);
      return true;
    } catch {
      return false;
    }
  },

  updatePrivacy: async (updates) => {
    const next = await profileService.updatePrivacySettings(updates);
    set({ privacy: next });
    await storage.setItem(STORAGE_KEYS.privacy, next);
    return true;
  },
}));
