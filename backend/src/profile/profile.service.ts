import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { User } from '../entities/user.entity';
import { UserProfile, PrivacySettings } from '../common/types';

@Injectable()
export class ProfileService {
  constructor(@InjectRepository(User) private users: Repository<User>) {}

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.users.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Profile not found');
    return user.toProfile();
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const user = await this.users.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Profile not found');

    const { id: _id, createdAt: _createdAt, ...rest } = updates;
    Object.assign(user, rest);
    const saved = await this.users.save(user);
    return saved.toProfile();
  }

  async getPrivacy(userId: string): Promise<PrivacySettings> {
    const user = await this.users.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Profile not found');
    return user.toPrivacy();
  }

  async updatePrivacy(userId: string, updates: Partial<PrivacySettings>): Promise<PrivacySettings> {
    const user = await this.users.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Profile not found');

    Object.assign(user, updates);
    const saved = await this.users.save(user);
    return saved.toPrivacy();
  }

  async createDefault(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const user = this.users.create({
      id: userId,
      name: data.name ?? 'New User',
      phone: data.phone ?? '',
      whatsapp: data.whatsapp ?? data.phone ?? '',
      bio: data.bio ?? '',
      email: data.email,
      title: data.title,
      company: data.company,
      avatar: data.avatar,
    });
    const saved = await this.users.save(user);
    return saved.toProfile();
  }

  async findCore(userId: string): Promise<User | null> {
    return this.users.findOneBy({ id: userId });
  }
}