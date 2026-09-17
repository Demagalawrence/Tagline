import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  const jwt = { sign: jest.fn().mockReturnValue('signed-token') };
  const users: any = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn((u: any) => u),
    save: jest.fn((u: any) => ({ ...u, id: u.id ?? 'usr_1' })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(users, jwt as any);
  });

  describe('register', () => {
    it('creates a hashed user and returns a JWT', async () => {
      users.findOne.mockResolvedValue(null);
      users.save.mockImplementation((u: any) => {
        const saved = new User();
        Object.assign(saved, u, {
          id: 'usr_1',
          name: u.name,
          email: u.email,
          phone: u.phone,
          whatsapp: u.whatsapp,
          bio: '',
          createdAt: new Date('2026-01-01T00:00:00Z'),
        });
        return saved;
      });

      const result = await service.register('Jane Doe', 'jane@example.com', '+256700000000', 'secret123');

      expect(users.findOne).toHaveBeenCalledWith({ where: { email: 'jane@example.com' } });
      expect(users.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'jane@example.com',
          phone: '+256700000000',
          whatsapp: '+256700000000',
        }),
      );
      expect(result.token).toBe('signed-token');
      expect(result.user).toEqual(
        expect.objectContaining({ id: 'usr_1', name: 'Jane Doe', email: 'jane@example.com' }),
      );
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('rejects a duplicate email', async () => {
      users.findOne.mockResolvedValue({ id: 'usr_x' });

      await expect(service.register('Jane', 'dupe@example.com', '+256700000000', 'secret123')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('returns a token for valid credentials', async () => {
      const user = new User();
      Object.assign(user, {
        id: 'usr_1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+256700000000',
        whatsapp: '+256700000000',
        passwordHash: await import('bcrypt').then((b) => b.hash('secret123', 4)),
        createdAt: new Date('2026-01-01T00:00:00Z'),
      });
      users.findOne.mockResolvedValue(user);

      const result = await service.login('jane@example.com', 'secret123');

      expect(result.token).toBe('signed-token');
      expect(result.user.id).toBe('usr_1');
    });

    it('rejects a wrong password', async () => {
      const user = new User();
      Object.assign(user, {
        email: 'jane@example.com',
        passwordHash: await import('bcrypt').then((b) => b.hash('right-password', 4)),
      });
      users.findOne.mockResolvedValue(user);

      await expect(service.login('jane@example.com', 'wrong-password')).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an unknown email', async () => {
      users.findOne.mockResolvedValue(null);

      await expect(service.login('ghost@example.com', 'whatever')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('findById', () => {
    it('returns a sanitized profile or null', async () => {
      const user = new User();
      Object.assign(user, { id: 'usr_1', name: 'Jane', email: 'jane@example.com', createdAt: new Date() });
      users.findOneBy.mockResolvedValue(user);
      await expect(service.findById('usr_1')).resolves.toEqual(
        expect.objectContaining({ id: 'usr_1', name: 'Jane' }),
      );

      users.findOneBy.mockResolvedValue(null);
      await expect(service.findById('missing')).resolves.toBeNull();
    });
  });
});