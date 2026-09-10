import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { UserProfile, PrivacySettings } from '../common/types';

@Injectable()
export class ProfileService {
  private profiles = new Map<string, UserProfile>();
  private privacy = new Map<string, PrivacySettings>();

  private defaultPrivacy: PrivacySettings = {
    showPhone: true,
    showWhatsapp: true,
    showPhoto: true,
    allowDiscovery: true,
    allowOfflineSharing: true,
  };

  async getProfile(userId: string): Promise<UserProfile> {
    const profile = this.profiles.get(userId);
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const existing = this.profiles.get(userId);
    if (!existing) throw new NotFoundException('Profile not found');

    const next: UserProfile = { ...existing, ...updates, id: userId };
    this.profiles.set(userId, next);
    return next;
  }

  async getPrivacy(userId: string): Promise<PrivacySettings> {
    return this.privacy.get(userId) ?? { ...this.defaultPrivacy };
  }

  async updatePrivacy(userId: string, updates: Partial<PrivacySettings>): Promise<PrivacySettings> {
    const current = this.privacy.get(userId) ?? { ...this.defaultPrivacy };
    const next = { ...current, ...updates };
    this.privacy.set(userId, next);
    return next;
  }

  async createDefault(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const profile: UserProfile = {
      id: userId,
      name: data.name ?? 'New User',
      phone: data.phone ?? '',
      whatsapp: data.whatsapp ?? data.phone ?? '',
      bio: data.bio ?? '',
      email: data.email,
      title: data.title,
      company: data.company,
      avatar: data.avatar,
      createdAt: new Date().toISOString(),
    };
    this.profiles.set(userId, profile);
    return profile;
  }
}
