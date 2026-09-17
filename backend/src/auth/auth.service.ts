import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { User } from '../entities/user.entity';
import { UserProfile } from '../common/types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async register(name: string, email: string, phone: string, password: string) {
    const existing = await this.users.findOne({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.users.create({
      id: `usr_${uuid()}`,
      name,
      email,
      phone,
      whatsapp: phone,
      bio: '',
      passwordHash,
    });
    const saved = await this.users.save(user);

    const token = this.jwt.sign({ sub: saved.id });
    return { user: saved.toProfile(), token };
  }

  async login(email: string, password: string) {
    const user = await this.users.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwt.sign({ sub: user.id });
    return { user: user.toProfile(), token };
  }

  async forgotPassword(email: string): Promise<boolean> {
    const user = await this.users.findOne({ where: { email } });
    if (!user) return false;
    // In production: send email with reset link
    return true;
  }

  async findById(id: string): Promise<UserProfile | null> {
    const user = await this.users.findOneBy({ id });
    return user ? user.toProfile() : null;
  }
}