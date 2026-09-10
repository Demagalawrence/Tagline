import { UserProfile } from '../types';
import { MOCK_USER } from '../mock/user';

export interface AuthService {
  login(email: string, pass: string): Promise<{ user: UserProfile; token: string }>;
  register(name: string, email: string, phone: string): Promise<{ user: UserProfile; token: string }>;
  logout(): Promise<void>;
  forgotPassword(email: string): Promise<boolean>;
}

export class MockAuthService implements AuthService {
  async login(email: string, pass: string): Promise<{ user: UserProfile; token: string }> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      user: { ...MOCK_USER, email: email || MOCK_USER.email },
      token: 'mock_jwt_token_connectqr_2026',
    };
  }

  async register(name: string, email: string, phone: string): Promise<{ user: UserProfile; token: string }> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      user: {
        ...MOCK_USER,
        id: `usr_${Date.now()}`,
        name: name || 'New User',
        email: email || 'user@connectqr.app',
        phone: phone || '+256 700 000 000',
        whatsapp: phone || '+256 700 000 000',
      },
      token: 'mock_jwt_token_connectqr_2026',
    };
  }

  async logout(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  async forgotPassword(email: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return true;
  }
}

export const authService = new MockAuthService();
