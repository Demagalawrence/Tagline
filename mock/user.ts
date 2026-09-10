import { UserProfile, PrivacySettings } from '../types';

export const MOCK_USER: UserProfile = {
  id: 'usr_medi_01',
  name: 'Medi',
  phone: '+256 700 123 456',
  whatsapp: '+256 700 123 456',
  bio: 'Software Engineering Student & Full-Stack Mobile Developer',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  title: 'Software Engineering Student',
  company: 'ConnectQR Dev Team',
  email: 'medi@connectqr.app',
  location: 'Kampala, Uganda',
  website: 'https://connectqr.app/u/medi',
  createdAt: '2026-01-15T08:00:00.000Z',
};

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  showPhone: true,
  showWhatsapp: true,
  showPhoto: true,
  allowDiscovery: true,
  allowOfflineSharing: true,
};
