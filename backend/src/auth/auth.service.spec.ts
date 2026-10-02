import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { AuthService } from './auth.service'
import { User } from '../entities/user.entity'
import { AuthSession } from '../entities/auth-session.entity'
import { MailService } from './mail.service'

describe('AuthService', () => {
  let service: AuthService
  const jwt = { sign: jest.fn().mockReturnValue('signed-token') }
  const mail = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    sendMagicLinkEmail: jest.fn().mockResolvedValue(undefined),
  }
  const users = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn((u: Partial<User>) => u),
    save: jest.fn((u: Partial<User>) => ({ ...u, id: u.id ?? 'usr_1' })),
  }
  const sessions = {
    create: jest.fn((s: Partial<AuthSession>) => s),
    save: jest.fn((s: Partial<AuthSession>) => s),
    find: jest.fn().mockResolvedValue([]),
    findOneBy: jest.fn(),
    update: jest.fn().mockResolvedValue({ affected: 2 }),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    sessions.find.mockResolvedValue([])
    sessions.findOneBy.mockResolvedValue(undefined)
    sessions.update.mockResolvedValue({ affected: 2 })
    sessions.delete.mockResolvedValue({ affected: 1 })
    service = new AuthService(
      users as unknown as Repository<User>,
      sessions as unknown as Repository<AuthSession>,
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
      Object.assign(user, {
        id: 'usr_1',
        emailVerified: false,
        verificationToken: 'tok123',
        verificationTokenExpiresAt: new Date(Date.now() + 60_000),
      })
      users.findOne.mockResolvedValue(user)

      await expect(service.verifyEmail('tok123')).resolves.toEqual({ verified: true })
      expect(users.save).toHaveBeenCalledWith(
        expect.objectContaining({
          emailVerified: true,
          verificationToken: undefined,
          verificationTokenExpiresAt: undefined,
        }),
      )
    })

    it('looks the token up under a live-expiry constraint', async () => {
      users.findOne.mockResolvedValue(null)

      await expect(service.verifyEmail('tok123')).rejects.toThrow(BadRequestException)

      const [where] = users.findOne.mock.calls[users.findOne.mock.calls.length - 1]
      expect(where.where.verificationTokenExpiresAt).toEqual(
        expect.objectContaining({ _type: 'moreThan' }),
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

  describe('sessions', () => {
    const makeSession = (over: Partial<AuthSession> = {}): AuthSession => {
      const s = new AuthSession()
      Object.assign(s, {
        id: 'ses_1',
        userId: 'usr_1',
        deviceLabel: 'Pixel 8 (Android)',
        userAgent: 'okhttp/4.12',
        ipAddress: '10.0.0.5',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
        ...over,
      })
      return s
    }

    it('stores a session row keyed by the token jti when signing in', async () => {
      jwt.sign.mockReturnValue('signed-token')
      users.findOne.mockResolvedValue(
        Object.assign(new User(), {
          id: 'usr_1',
          email: 'jane@example.com',
          passwordHash: await bcrypt.hash('secret123', 4),
        }),
      )

      await service.login('jane@example.com', 'secret123', {
        deviceLabel: 'Pixel 8 (Android)',
        userAgent: 'okhttp/4.12',
        ipAddress: '10.0.0.5',
      })

      const saved = sessions.save.mock.calls[0][0] as AuthSession
      expect(saved.userId).toBe('usr_1')
      expect(saved.deviceLabel).toBe('Pixel 8 (Android)')
      expect(saved.ipAddress).toBe('10.0.0.5')
      expect(saved.revokedAt).toBeNull()
      // The jti claim must be the row's primary key or revocation cannot work.
      expect(jwt.sign).toHaveBeenCalledWith({ sub: 'usr_1', jti: saved.id })
    })

    it('falls back to a generic device label when the client sends none', async () => {
      users.findOne.mockResolvedValue(
        Object.assign(new User(), {
          id: 'usr_1',
          email: 'jane@example.com',
          passwordHash: await bcrypt.hash('secret123', 4),
        }),
      )

      await service.login('jane@example.com', 'secret123')

      expect((sessions.save.mock.calls[0][0] as AuthSession).deviceLabel).toBe('Unknown device')
    })

    it('marks the caller as the current session in the device list', async () => {
      sessions.find.mockResolvedValue([makeSession({ id: 'ses_2' }), makeSession({ id: 'ses_1' })])

      const list = await service.listSessions('usr_1', 'ses_1')

      expect(list.map((s) => s.isCurrent)).toEqual([false, true])
      expect(list[0].isActive).toBe(true)
    })

    it('flags revoked and expired sessions as inactive', async () => {
      sessions.find.mockResolvedValue([
        makeSession({ id: 'ses_revoked', revokedAt: new Date() }),
        makeSession({ id: 'ses_expired', expiresAt: new Date(Date.now() - 1000) }),
      ])

      const list = await service.listSessions('usr_1')
      expect(list.every((s) => !s.isActive)).toBe(true)
    })

    it('refuses to revoke a session belonging to another account', async () => {
      sessions.findOneBy.mockResolvedValue(null)
      await expect(service.revokeSession('usr_1', 'ses_other')).rejects.toThrow(NotFoundException)
    })

    it('refuses to revoke the session in use, so logout is the only way', async () => {
      sessions.findOneBy.mockResolvedValue(makeSession({ id: 'ses_1' }))
      await expect(service.revokeSession('usr_1', 'ses_1', 'ses_1')).rejects.toThrow(
        BadRequestException,
      )
    })

    it('is idempotent when a session was already revoked', async () => {
      sessions.findOneBy.mockResolvedValue(makeSession({ revokedAt: new Date() }))
      await expect(service.revokeSession('usr_1', 'ses_1', 'ses_other')).resolves.toEqual({
        revoked: true,
        alreadyRevoked: true,
      })
    })

    it('signs out other devices while keeping the current one', async () => {
      const result = await service.revokeOtherSessions('usr_1', 'ses_1')
      expect(result).toEqual({ revoked: 2 })
      expect(sessions.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: expect.not.stringMatching(/^ses_1$/) }),
        { revokedAt: expect.any(Date) },
      )
    })

    it('revokes the current session on logout', async () => {
      sessions.findOneBy.mockResolvedValue(makeSession({ id: 'ses_1' }))
      await expect(service.logout('ses_1')).resolves.toEqual({ loggedOut: true })
      expect((sessions.save.mock.calls[0][0] as AuthSession).revokedAt).toEqual(expect.any(Date))
    })

    it('rejects a revoked session token', async () => {
      sessions.findOneBy.mockResolvedValue(makeSession({ revokedAt: new Date() }))
      await expect(service.isSessionActive('ses_1')).resolves.toBe(false)
    })

    it('rejects a session id that no longer exists', async () => {
      sessions.findOneBy.mockResolvedValue(undefined)
      await expect(service.isSessionActive('ses_gone')).resolves.toBe(false)
    })

    it('does not rewrite lastUsedAt on every request', async () => {
      sessions.findOneBy.mockResolvedValue(makeSession({ lastUsedAt: new Date() }))

      await expect(service.isSessionActive('ses_1')).resolves.toBe(true)
      expect(sessions.update).not.toHaveBeenCalled()
    })

    it('refreshes lastUsedAt once it has drifted', async () => {
      sessions.findOneBy.mockResolvedValue(
        makeSession({ lastUsedAt: new Date(Date.now() - 60 * 60 * 1000) }),
      )

      await expect(service.isSessionActive('ses_1')).resolves.toBe(true)
      expect(sessions.update).toHaveBeenCalledWith({ id: 'ses_1' }, { lastUsedAt: expect.any(Date) })
    })

    it('purges only rows that have already expired', async () => {
      await service.purgeExpiredSessions()
      const [where] = sessions.delete.mock.calls[0]
      expect(where).toEqual(
        expect.objectContaining({ expiresAt: expect.objectContaining({ _type: 'lessThan' }) }),
      )
    })
  })

  describe('passwordless sign-in', () => {
    const makeUser = (over: Partial<User> = {}) =>
      Object.assign(new User(), {
        id: 'usr_1',
        name: 'Jane',
        email: 'jane@example.com',
        createdAt: new Date(),
        ...over,
      })

    const savedUser = () => users.save.mock.calls[users.save.mock.calls.length - 1][0] as User

    it('stores a hashed code and a token with a short expiry', async () => {
      users.findOne.mockResolvedValue(makeUser())

      const res = await service.requestMagicLink('jane@example.com')

      const user = savedUser()
      expect(user.loginToken).toEqual(expect.any(String))
      expect(user.loginCodeHash).toEqual(expect.any(String))
      // The code must never be stored in the clear.
      expect(user.loginCodeHash).not.toBe(res.devLoginCode)
      const ttl = user.loginTokenExpiresAt!.getTime() - Date.now()
      expect(ttl).toBeGreaterThan(8 * 60 * 1000)
      expect(ttl).toBeLessThanOrEqual(10 * 60 * 1000)
    })

    it('always reports success for an unknown address, so accounts cannot be enumerated', async () => {
      users.findOne.mockResolvedValue(null)
      const res = await service.requestMagicLink('nobody@example.com')

      expect(res).toEqual({ sent: true })
      expect(users.save).not.toHaveBeenCalled()
      expect(mail.sendMagicLinkEmail).not.toHaveBeenCalled()
    })

    it('emails a 6-digit code alongside the link', async () => {
      users.findOne.mockResolvedValue(makeUser())
      const res = await service.requestMagicLink('jane@example.com')

      expect(res.devLoginCode).toMatch(/^\d{6}$/)
      expect(mail.sendMagicLinkEmail).toHaveBeenCalledWith(
        'jane@example.com',
        res.devLoginToken,
        res.devLoginCode,
      )
    })

    it('replaces an earlier unused challenge rather than accumulating them', async () => {
      users.findOne.mockResolvedValue(makeUser())
      await service.requestMagicLink('jane@example.com')
      const first = savedUser().loginToken

      await service.requestMagicLink('jane@example.com')
      expect(savedUser().loginToken).not.toBe(first)
    })

    it('exchanges a link token for a session and burns the challenge', async () => {
      const user = makeUser({ loginToken: 'tok', loginTokenExpiresAt: new Date(Date.now() + 60_000) })
      users.findOne.mockResolvedValue(user)

      const res = await service.verifyMagicLink('tok')

      expect(res.token).toBe('signed-token')
      const cleared = savedUser()
      expect(cleared.loginToken).toBeUndefined()
      expect(cleared.loginCodeHash).toBeUndefined()
      expect(cleared.loginTokenExpiresAt).toBeUndefined()
    })

    it('rejects an expired or unknown link token', async () => {
      users.findOne.mockResolvedValue(null)
      await expect(service.verifyMagicLink('stale')).rejects.toThrow(BadRequestException)
    })

    it('exchanges the emailed code for a session', async () => {
      const hash = await bcrypt.hash('042917', 10)
      users.findOne.mockResolvedValue(
        makeUser({ loginCodeHash: hash, loginTokenExpiresAt: new Date(Date.now() + 60_000) }),
      )

      const res = await service.verifyLoginCode('jane@example.com', '042917')

      expect(res.token).toBe('signed-token')
      expect(savedUser().loginCodeHash).toBeUndefined()
    })

    it('leaves the challenge usable after a mistyped code', async () => {
      const hash = await bcrypt.hash('042917', 10)
      const user = makeUser({ loginCodeHash: hash, loginTokenExpiresAt: new Date(Date.now() + 60_000) })
      users.findOne.mockResolvedValue(user)

      await expect(service.verifyLoginCode('jane@example.com', '000000')).rejects.toThrow(
        UnauthorizedException,
      )
      expect(user.loginCodeHash).toBe(hash)
    })

    it('gives an unknown address and a wrong code the same error', async () => {
      users.findOne.mockResolvedValue(null)
      await expect(service.verifyLoginCode('nobody@example.com', '000000')).rejects.toThrow(
        'That code is invalid or has expired',
      )
    })

    it('looks the code up under a live-expiry constraint, so an expired challenge is never found', async () => {
      const hash = await bcrypt.hash('042917', 10)
      users.findOne.mockResolvedValue(
        makeUser({ loginCodeHash: hash, loginTokenExpiresAt: new Date(Date.now() + 60_000) }),
      )

      await service.verifyLoginCode('jane@example.com', '042917')

      const [where] = users.findOne.mock.calls[users.findOne.mock.calls.length - 1]
      expect(where.where.loginTokenExpiresAt).toEqual(
        expect.objectContaining({ _type: 'moreThan' }),
      )
    })

    it('requires a password to set for passwordless, so a code cannot strip it', async () => {
      const hash = await bcrypt.hash('042917', 10)
      users.findOne.mockResolvedValue(
        makeUser({ passwordHash: 'existing', loginCodeHash: hash, loginTokenExpiresAt: new Date() }),
      )
      await service.verifyLoginCode('jane@example.com', '042917')
      expect(savedUser().passwordHash).toBe('existing')
    })
  })
})
