import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export interface MailMessage {
  to: string
  subject: string
  html: string
}

/**
 * Sends transactional email. Without SMTP credentials it falls back to a
 * detailed console log (dev/sandbox mode), so the reset and verification flows
 * remain testable end-to-end before any mail provider is configured.
 *
 * Set the following to switch to real delivery:
 *   MAIL_HOST, MAIL_PORT, MAIL_SECURE, MAIL_USER, MAIL_PASS, MAIL_FROM
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private readonly from: string

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get<string>('MAIL_FROM', 'ConnectQR <no-reply@connectqr.app>')
  }

  get baseUrl(): string {
    return this.config.get<string>('APP_BASE_URL', 'http://localhost:3000')
  }

  buildVerificationUrl(token: string): string {
    return `${this.baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`
  }

  buildResetUrl(token: string): string {
    return `${this.baseUrl}/reset-password?token=${encodeURIComponent(token)}`
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    await this.send({
      to,
      subject: 'Verify your ConnectQR account',
      html: `
        <p>Welcome! Confirm your email address to activate your ConnectQR account.</p>
        <p><a href="${this.buildVerificationUrl(token)}">Verify my email</a></p>
        <p>Or open this link: ${this.buildVerificationUrl(token)}</p>
      `,
    })
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    await this.send({
      to,
      subject: 'Reset your ConnectQR password',
      html: `
        <p>A password reset was requested for your ConnectQR account.</p>
        <p><a href="${this.buildResetUrl(token)}">Reset my password</a></p>
        <p>Or open this link: ${this.buildResetUrl(token)}</p>
        <p>This link expires in 1 hour. If you did not request it, ignore this email.</p>
      `,
    })
  }

  private async send(message: MailMessage): Promise<void> {
    const host = this.config.get<string>('MAIL_HOST')
    if (host) {
      await this.sendSmtp(message)
      return
    }

    // Sandbox mode: surface the full message (token included) in the logs so a
    // developer can complete the flow without any mail server.
    this.logger.log(
      `[sandbox mail] to=${message.to} subject="${message.subject}"\n${message.html}`,
    )
  }

  private async sendSmtp(message: MailMessage): Promise<void> {
    const credentials = [
      this.config.get<string>('MAIL_HOST'),
      this.config.get<string>('MAIL_PORT'),
      this.config.get<string>('MAIL_USER'),
      this.config.get<string>('MAIL_FROM'),
    ]
    if (credentials.some((v) => !v)) {
      this.logger.warn(
        'MAIL_HOST is set but MAIL_PORT/USER/FROM are incomplete; falling back to console mail.',
      )
      this.logger.log(`[sandbox mail] to=${message.to} subject="${message.subject}"`)
      return
    }

    // nodemailer is deliberately not a hard dependency: it is only required at
    // the moment real SMTP delivery is configured.
    try {
      const mailer = await import('nodemailer')
      const transporter = mailer
        .createTransport({
          host: this.config.get<string>('MAIL_HOST'),
          port: this.config.get<number>('MAIL_PORT', 587),
          secure: this.config.get<string>('MAIL_SECURE', 'false') === 'true',
          auth:
            this.config.get<string>('MAIL_USER') && this.config.get<string>('MAIL_PASS')
              ? {
                  user: this.config.get<string>('MAIL_USER'),
                  pass: this.config.get<string>('MAIL_PASS'),
                }
              : undefined,
        })
      await transporter.sendMail({
        from: this.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
      })
    } catch (err) {
      this.logger.warn(
        `SMTP delivery failed (${err instanceof Error ? err.message : err}); falling back to console mail.`,
      )
      this.logger.log(`[sandbox mail] to=${message.to} subject="${message.subject}"`)
    }
  }
}