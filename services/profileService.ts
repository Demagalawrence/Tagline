import { UserProfile, PrivacySettings } from '../types';
import { MOCK_USER, DEFAULT_PRIVACY_SETTINGS } from '../mock/user';

export interface ProfileService {
  getProfile(): Promise<UserProfile>;
  updateProfile(updates: Partial<UserProfile>): Promise<UserProfile>;
  getPrivacySettings(): Promise<PrivacySettings>;
  updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<PrivacySettings>;
}

export class MockProfileService implements ProfileService {
  private currentProfile: UserProfile = { ...MOCK_USER };
  private privacySettings: PrivacySettings = { ...DEFAULT_PRIVACY_SETTINGS };

  async getProfile(): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { ...this.currentProfile };
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    this.currentProfile = {
      ...this.currentProfile,
      ...updates,
    };
    return { ...this.currentProfile };
  }

  async getPrivacySettings(): Promise<PrivacySettings> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return { ...this.privacySettings };
  }

  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    this.privacySettings = {
      ...this.privacySettings,
      ...settings,
    };
    return { ...this.privacySettings };
  }
}

export const profileService = new MockProfileService();
