import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, MoreThan, LessThan, IsNull, Not } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { randomInt, randomBytes } from 'crypto'
import { v4 as uuid } from 'uuid'
import { User } from '../entities/user.entity'
import { AuthSession } from '../entities/auth-session.entity'
import { AuthSessionInfo, UserProfile } from '../common/types'
import { MailService } from './mail.service'
import { SessionContext } from './session-context'

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days, matches JWT_EXPIRES_IN
/** Don't rewrite lastUsedAt on every single request, only when it drifts. */
const SESSION_TOUCH_INTERVAL_MS = 5 * 60 * 1000
/** Short on purpose: a sign-in code that sits in an inbox for days is a liability. */
const LOGIN_TOKEN_TTL_MS = 10 * 60 * 1000 // 10 minutes
const LOGIN_CODE_LENGTH = 6

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(AuthSession) private sessions: Repository<AuthSession>,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  private newToken(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Signs a JWT and records the matching session row. The `jti` claim *is* the
   * session id, which is what lets `logout` and the device list revoke a token
   * that is still within its expiry window.
   */
  private async issueToken(user: User, context?: SessionContext): Promise<string> {
    const id = `ses_${uuid()}`
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

    await this.sessions.save(
      this.sessions.create({
        id,
        userId: user.id,
        deviceLabel: context?.deviceLabel?.trim().slice(0, 80) || 'Unknown device',
        userAgent: context?.userAgent?.slice(0, 255) ?? null,
        ipAddress: context?.ipAddress ?? null,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        expiresAt,
        revokedAt: null,
      }),
    )

    return this.jwt.sign({ sub: user.id, jti: id })
  }

  /**
   * Returns the reset/verification token in development so the whole flow can
   * be exercised locally against the console mail log. Never leaked in prod.
   */
  private devOnly(env: string | undefined, token: string) {
    return (env ?? 'development') === 'production' ? undefined : token
  }

  async register(
    name: string,
    email: string,
    phone: string,
    password: string,
    context?: SessionContext,
  ) {
    const existing = await this.users.findOne({ where: { email } })
    if (existing) throw new ConflictException('Email already registered')

    const passwordHash = await bcrypt.hash(password, 10)
    const verificationToken = this.newToken()
    const user = this.users.create({
      id: `usr_${uuid()}`,
      name,
      email,
      phone,
      whatsapp: phone,
      bio: '',
      passwordHash,
      emailVerified: false,
      verificationToken,
      verificationTokenExpiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    })
    const saved = await this.users.save(user)

    await this.mail.sendVerificationEmail(email, verificationToken)

    const token = await this.issueToken(saved, context)
    return {
      user: saved.toProfile(),
      token,
      devVerificationToken: this.devOnly(process.env.NODE_ENV, verificationToken),
    }
  }

  async login(email: string, password: string, context?: SessionContext) {
    const user = await this.users.findOne({ where: { email } })
    if (!user) throw new UnauthorizedException('Invalid credentials')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new UnauthorizedException('Invalid credentials')

    const token = await this.issueToken(user, context)
    return { user: user.toProfile(), token }
  }

  async verifyEmail(token: string): Promise<{ verified: boolean }> {
    // A null expiry is treated as expired: a legacy row must not become a
    // token that never dies.
    const user = await this.users.findOne({
      where: { verificationToken: token, verificationTokenExpiresAt: MoreThan(new Date()) },
    })
    if (!user) throw new BadRequestException('Invalid or expired verification link')

    user.emailVerified = true
    user.verificationToken = undefined
    user.verificationTokenExpiresAt = undefined
    await this.users.save(user)
    return { verified: true }
  }

  /**
   * Issues a fresh verification token to an unverified account. Only reached
   * when the address has not been confirmed yet, so it cannot be used for spam.
   */
  async resendVerification(email: string): Promise<{
    sent: boolean
    emailVerified: boolean
    devVerificationToken?: string
  }> {
    const user = await this.users.findOne({ where: { email } })
    if (!user) return { sent: false, emailVerified: false }
    if (user.emailVerified) return { sent: false, emailVerified: true }

    user.verificationToken = this.newToken()
    user.verificationTokenExpiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS)
    await this.users.save(user)
    await this.mail.sendVerificationEmail(email, user.verificationToken)
    return {
      sent: true,
      emailVerified: false,
      devVerificationToken: this.devOnly(process.env.NODE_ENV, user.verificationToken),
    }
  }

  async forgotPassword(email: string) {
    const user = await this.users.findOne({ where: { email } })
    if (!user) return { sent: false }

    user.resetToken = this.newToken()
    user.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)
    await this.users.save(user)
    await this.mail.sendPasswordResetEmail(email, user.resetToken)

    return {
      sent: true,
      devResetToken: this.devOnly(process.env.NODE_ENV, user.resetToken),
    }
  }

  async resetPassword(token: string, password: string): Promise<{ reset: boolean }> {
    const user = await this.users.findOne({
      where: { resetToken: token, resetTokenExpiresAt: MoreThan(new Date()) },
    })
    if (!user) throw new BadRequestException('Invalid or expired reset token')

    user.passwordHash = await bcrypt.hash(password, 10)
    user.resetToken = undefined
    user.resetTokenExpiresAt = undefined
    await this.users.save(user)
    return { reset: true }
  }

  async findById(id: string): Promise<UserProfile | null> {
    const user = await this.users.findOneBy({ id })
    return user ? user.toProfile() : null
  }

  /**
   * Emails a sign-in link (and its 6-digit fallback code) to an existing
   * account. The response is identical whether or not the address is known, so
   * this endpoint cannot be used to discover which emails are registered.
   */
  async requestMagicLink(email: string) {
    const user = await this.users.findOne({ where: { email } })
    if (!user) return { sent: true }

    const token = this.newToken()
    const code = this.newLoginCode()

    user.loginToken = token
    user.loginCodeHash = await bcrypt.hash(code, 10)
    user.loginTokenExpiresAt = new Date(Date.now() + LOGIN_TOKEN_TTL_MS)
    await this.users.save(user)

    await this.mail.sendMagicLinkEmail(user.email, token, code)

    return {
      sent: true,
      devLoginToken: this.devOnly(process.env.NODE_ENV, token),
      devLoginCode: this.devOnly(process.env.NODE_ENV, code),
    }
  }

  /** Exchanges the emailed link token for a real session. Single use. */
  async verifyMagicLink(token: string, context?: SessionContext) {
    const user = await this.users.findOne({
      where: { loginToken: token, loginTokenExpiresAt: MoreThan(new Date()) },
    })
    if (!user) throw new BadRequestException('That sign-in link is invalid or has expired')

    await this.clearLoginChallenge(user)
    return { user: user.toProfile(), token: await this.issueToken(user, context) }
  }

  /**
   * Exchanges the emailed 6-digit code for a session. A wrong code leaves the
   * challenge intact so a typo can be retried; the endpoint's throttle is what
   * bounds guessing.
   */
  async verifyLoginCode(email: string, code: string, context?: SessionContext) {
    const user = await this.users.findOne({
      where: { email, loginTokenExpiresAt: MoreThan(new Date()) },
    })
    // Same message either way: don't reveal whether the address or code was wrong.
    const invalid = new UnauthorizedException('That code is invalid or has expired')
    if (!user?.loginCodeHash) throw invalid

    if (!(await bcrypt.compare(code, user.loginCodeHash))) throw invalid

    await this.clearLoginChallenge(user)
    return { user: user.toProfile(), token: await this.issueToken(user, context) }
  }

  /** Invalidate both halves of the challenge so neither can be replayed. */
  private async clearLoginChallenge(user: User): Promise<void> {
    user.loginToken = undefined
    user.loginCodeHash = undefined
    user.loginTokenExpiresAt = undefined
    await this.users.save(user)
  }

  private newLoginCode(): string {
    // Uniform over 0-999999, so every code has the same probability. The
    // leading-zero padding is what makes it a 6-character code, not a 4-digit one.
    return String(randomInt(0, 10 ** LOGIN_CODE_LENGTH)).padStart(LOGIN_CODE_LENGTH, '0')
  }

  /**
   * Issues a new token for an already-authenticated user. Used by the mobile
   * client to extend a session without re-sending a password. The old session is
   * kept alive so refresh doesn't silently sign the device out of the list.
   */
  async refresh(userId: string, context?: SessionContext) {
    const user = await this.users.findOneBy({ id: userId })
    if (!user) throw new UnauthorizedException('Account no longer exists')
    return { user: user.toProfile(), token: await this.issueToken(user, context) }
  }

  /**
   * Every live session for an account, newest first. Expired and revoked rows
   * are included but flagged, so the UI can show a real history instead of
   * pretending a device never existed.
   */
  async listSessions(userId: string, currentSessionId?: string): Promise<AuthSessionInfo[]> {
    const rows = await this.sessions.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    })
    return rows.map((row) => row.toDto(currentSessionId))
  }

  /** Revokes one device. Scoped to the owner so ids cannot be guessed across accounts. */
  async revokeSession(userId: string, sessionId: string, currentSessionId?: string) {
    const session = await this.sessions.findOneBy({ id: sessionId, userId })
    if (!session) throw new NotFoundException('Session not found')

    if (session.id === currentSessionId) {
      throw new BadRequestException('Use sign out to end the session you are using')
    }
    if (session.revokedAt) return { revoked: true, alreadyRevoked: true }

    session.revokedAt = new Date()
    await this.sessions.save(session)
    return { revoked: true, alreadyRevoked: false }
  }

  /**
   * Signs out every device. `exceptSessionId` is the caller's own session, so
   * "sign out other devices" keeps the current one working.
   */
  async revokeOtherSessions(userId: string, exceptSessionId?: string) {
    const where = exceptSessionId
      ? { userId, id: Not(exceptSessionId), revokedAt: IsNull() }
      : { userId, revokedAt: IsNull() }

    const result = await this.sessions.update(where, { revokedAt: new Date() })
    return { revoked: result.affected ?? 0 }
  }

  /** Ends the caller's own session. */
  async logout(currentSessionId: string) {
    const session = await this.sessions.findOneBy({ id: currentSessionId })
    if (session && !session.revokedAt) {
      session.revokedAt = new Date()
      await this.sessions.save(session)
    }
    return { loggedOut: true }
  }

  /**
   * Guard-side check for a presented token. Returns false for revoked, expired or
   * unknown sessions, and refreshes lastUsedAt only when it has drifted, so a
   * busy client doesn't write on every request.
   */
  async isSessionActive(sessionId: string, now = new Date()): Promise<boolean> {
    const session = await this.sessions.findOneBy({ id: sessionId })
    if (!session || !session.isActive(now)) return false

    const drift = now.getTime() - (session.lastUsedAt?.getTime() ?? 0)
    if (drift > SESSION_TOUCH_INTERVAL_MS) {
      await this.sessions.update({ id: sessionId }, { lastUsedAt: now })
    }
    return true
  }

  /** Housekeeping: drop rows that can no longer authenticate anyone. */
  async purgeExpiredSessions(): Promise<number> {
    const result = await this.sessions.delete({ expiresAt: LessThan(new Date()) })
    return result.affected ?? 0
  }
}
