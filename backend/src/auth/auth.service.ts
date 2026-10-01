import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, MoreThan } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { randomBytes } from 'crypto'
import { v4 as uuid } from 'uuid'
import { User } from '../entities/user.entity'
import { UserProfile } from '../common/types'
import { MailService } from './mail.service'

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  private newToken(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Returns the reset/verification token in development so the whole flow can
   * be exercised locally against the console mail log. Never leaked in prod.
   */
  private devOnly(env: string | undefined, token: string) {
    return (env ?? 'development') === 'production' ? undefined : token
  }

  async register(name: string, email: string, phone: string, password: string) {
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
    })
    const saved = await this.users.save(user)

    await this.mail.sendVerificationEmail(email, verificationToken)

    const token = this.jwt.sign({ sub: saved.id })
    return {
      user: saved.toProfile(),
      token,
      devVerificationToken: this.devOnly(process.env.NODE_ENV, verificationToken),
    }
  }

  async login(email: string, password: string) {
    const user = await this.users.findOne({ where: { email } })
    if (!user) throw new UnauthorizedException('Invalid credentials')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new UnauthorizedException('Invalid credentials')

    const token = this.jwt.sign({ sub: user.id })
    return { user: user.toProfile(), token }
  }

  async verifyEmail(token: string): Promise<{ verified: boolean }> {
    const user = await this.users.findOneBy({ verificationToken: token })
    if (!user) throw new BadRequestException('Invalid or expired verification link')

    user.emailVerified = true
    user.verificationToken = undefined
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
   * Issues a new token for an already-authenticated user. Used by the mobile
   * client to extend a session without re-sending a password.
   */
  async refresh(userId: string) {
    const user = await this.users.findOneBy({ id: userId })
    if (!user) throw new UnauthorizedException('Account no longer exists')
    return { user: user.toProfile(), token: this.jwt.sign({ sub: user.id }) }
  }
}
