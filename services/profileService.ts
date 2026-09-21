import { UserProfile, PrivacySettings } from '../types';
import { apiRequest } from './api';

export interface ProfileService {
  getProfile(): Promise<UserProfile>;
  updateProfile(updates: Partial<UserProfile>): Promise<UserProfile>;
  getPrivacySettings(): Promise<PrivacySettings>;
  updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<PrivacySettings>;
}

export class ApiProfileService implements ProfileService {
  async getProfile(): Promise<UserProfile> {
    return apiRequest<UserProfile>('/api/profile', { auth: true });
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    return apiRequest<UserProfile>('/api/profile', {
      method: 'PATCH',
      body: updates,
      auth: true,
    });
  }

  async getPrivacySettings(): Promise<PrivacySettings> {
    return apiRequest<PrivacySettings>('/api/profile/privacy', { auth: true });
  }

  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    return apiRequest<PrivacySettings>('/api/profile/privacy', {
      method: 'PATCH',
      body: settings,
      auth: true,
    });
  }
}

export const profileService: ProfileService = new ApiProfileService();