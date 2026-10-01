import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Repository } from 'typeorm'
import { AuthService } from './auth.service'
import { User } from '../entities/user.entity'
import { MailService } from './mail.service'

describe('AuthService', () => {
  let service: AuthService
  const jwt = { sign: jest.fn().mockReturnValue('signed-token') }
  const mail = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  }
  const users = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn((u: Partial<User>) => u),
    save: jest.fn((u: Partial<User>) => ({ ...u, id: u.id ?? 'usr_1' })),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    service = new AuthService(
      users as unknown as Repository<User>,
      jwt as unknown as JwtService,
      mail as unknown as MailService,
    )
  })

  describe('register', () => {
    it('creates a hashed user and returns a JWT', async () => {
      users.findOne.mockResolvedValue(null)
      users.save.mockImplementation((u: Partial<User>) => {
        const saved = new User()
        Object.assign(saved, u, {
          id: 'usr_1',
          name: u.name,
          email: u.email,
          phone: u.phone,
          whatsapp: u.whatsapp,
          bio: '',
          createdAt: new Date('2026-01-01T00:00:00Z'),
        })
        return saved
      })

      const result = await service.register(
        'Jane Doe',
        'jane@example.com',
        '+256700000000',
        'secret123',
      )

      expect(users.findOne).toHaveBeenCalledWith({ where: { email: 'jane@example.com' } })
      expect(users.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'jane@example.com',
          phone: '+256700000000',
          whatsapp: '+256700000000',
        }),
      )
      expect(result.token).toBe('signed-token')
      expect(result.user).toEqual(
        expect.objectContaining({ id: 'usr_1', name: 'Jane Doe', email: 'jane@example.com' }),
      )
      expect(result.user).not.toHaveProperty('passwordHash')
    })

    it('rejects a duplicate email', async () => {
      users.findOne.mockResolvedValue({ id: 'usr_x' })

      await expect(
        service.register('Jane', 'dupe@example.com', '+256700000000', 'secret123'),
      ).rejects.toThrow(ConflictException)
    })
  })

  describe('login', () => {
    it('returns a token for valid credentials', async () => {
      const user = new User()
      Object.assign(user, {
        id: 'usr_1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+256700000000',
        whatsapp: '+256700000000',
        passwordHash: await import('bcrypt').then((b) => b.hash('secret123', 4)),
        createdAt: new Date('2026-01-01T00:00:00Z'),
      })
      users.findOne.mockResolvedValue(user)

      const result = await service.login('jane@example.com', 'secret123')

      expect(result.token).toBe('signed-token')
      expect(result.user.id).toBe('usr_1')
    })

    it('rejects a wrong password', async () => {
      const user = new User()
      Object.assign(user, {
        email: 'jane@example.com',
        passwordHash: await import('bcrypt').then((b) => b.hash('right-password', 4)),
      })
      users.findOne.mockResolvedValue(user)

      await expect(service.login('jane@example.com', 'wrong-password')).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('rejects an unknown email', async () => {
      users.findOne.mockResolvedValue(null)

      await expect(service.login('ghost@example.com', 'whatever')).rejects.toThrow(
        UnauthorizedException,
      )
    })
  })

  describe('verifyEmail', () => {
    it('confirms the address and clears the token', async () => {
      const user = new User()
      Object.assign(user, { id: 'usr_1', emailVerified: false, verificationToken: 'tok123' })
      users.findOneBy.mockResolvedValue(user)

      await expect(service.verifyEmail('tok123')).resolves.toEqual({ verified: true })
      expect(users.save).toHaveBeenCalledWith(
        expect.objectContaining({ emailVerified: true, verificationToken: undefined }),
      )
    })

    it('rejects an unknown token', async () => {
      users.findOneBy.mockResolvedValue(null)
      await expect(service.verifyEmail('nope')).rejects.toThrow(BadRequestException)
    })
  })

  describe('forgotPassword', () => {
    it('stores an expiring token and emails it', async () => {
      const user = new User()
      Object.assign(user, { id: 'usr_1', email: 'jane@example.com' })
      users.findOne.mockResolvedValue(user)

      const result = await service.forgotPassword('jane@example.com')

      expect(mail.sendPasswordResetEmail).toHaveBeenCalledWith(
        'jane@example.com',
        expect.any(String),
      )
      expect(users.save).toHaveBeenCalledWith(
        expect.objectContaining({
          resetToken: expect.any(String),
          resetTokenExpiresAt: expect.any(Date),
        }),
      )
      expect(result.sent).toBe(true)
    })

    it('does nothing for an unknown address', async () => {
      users.findOne.mockResolvedValue(null)
      await expect(service.forgotPassword('ghost@example.com')).resolves.toEqual({ sent: false })
      expect(mail.sendPasswordResetEmail).not.toHaveBeenCalled()
    })
  })

  describe('resetPassword', () => {
    it('replaces the password hash and clears the token', async () => {
      const user = new User()
      Object.assign(user, {
        id: 'usr_1',
        passwordHash: 'old-hash',
        resetToken: 'tok',
        resetTokenExpiresAt: new Date(Date.now() + 60_000),
      })
      users.findOne.mockResolvedValue(user)

      await expect(service.resetPassword('tok', 'brandnew123')).resolves.toEqual({ reset: true })
      expect(users.save).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordHash: expect.not.stringMatching(/^old-hash$/),
          resetToken: undefined,
          resetTokenExpiresAt: undefined,
        }),
      )
    })

    it('rejects an expired or unknown token', async () => {
      users.findOne.mockResolvedValue(null)
      await expect(service.resetPassword('stale', 'brandnew123')).rejects.toThrow(
        BadRequestException,
      )
    })
  })

  describe('findById', () => {
    it('returns a sanitized profile or null', async () => {
      const user = new User()
      Object.assign(user, {
        id: 'usr_1',
        name: 'Jane',
        email: 'jane@example.com',
        createdAt: new Date(),
      })
      users.findOneBy.mockResolvedValue(user)
      await expect(service.findById('usr_1')).resolves.toEqual(
        expect.objectContaining({ id: 'usr_1', name: 'Jane' }),
      )

      users.findOneBy.mockResolvedValue(null)
      await expect(service.findById('missing')).resolves.toBeNull()
    })
  })
})
