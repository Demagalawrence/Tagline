import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { UserProfile } from '../common/types';

interface StoredUser extends UserProfile {
  passwordHash: string;
}

@Injectable()
export class AuthService {
  private users = new Map<string, StoredUser>();

  constructor(private readonly jwt: JwtService) {}

  async register(name: string, email: string, phone: string, password: string) {
    const existing = [...this.users.values()].find((u) => u.email === email);
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(password, 10);
    const user: StoredUser = {
      id: `usr_${uuid()}`,
      name,
      email,
      phone,
      whatsapp: phone,
      bio: '',
      createdAt: new Date().toISOString(),
      passwordHash,
    };
    this.users.set(user.id, user);

    const token = this.jwt.sign({ sub: user.id });
    return { user: this.sanitize(user), token };
  }

  async login(email: string, password: string) {
    const user = [...this.users.values()].find((u) => u.email === email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwt.sign({ sub: user.id });
    return { user: this.sanitize(user), token };
  }

  async forgotPassword(email: string): Promise<boolean> {
    const user = [...this.users.values()].find((u) => u.email === email);
    if (!user) return false;
    // In production: send email with reset link
    return true;
  }

  async findById(id: string): Promise<UserProfile | null> {
    const user = this.users.get(id);
    return user ? this.sanitize(user) : null;
  }

  private sanitize(u: StoredUser): UserProfile {
    const { passwordHash, ...profile } = u;
    return profile;
  }
}
