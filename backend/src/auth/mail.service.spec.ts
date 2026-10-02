import { ConfigService } from '@nestjs/config'
import { MailService } from './mail.service'

function service(env: Record<string, string> = {}): MailService {
  const config = {
    get: (key: string, fallback?: string) => env[key] ?? fallback,
  }
  return new MailService(config as unknown as ConfigService)
}

describe('MailService links', () => {
  it('links to the API, not to a route that only accepts POST', () => {
    const mail = service({ APP_BASE_URL: 'https://api.connectqr.app' })

    expect(mail.buildVerificationUrl('a b')).toBe(
      'https://api.connectqr.app/api/auth/verify-email?token=a%20b',
    )
    expect(mail.buildResetUrl('tok')).toBe(
      'https://api.connectqr.app/api/auth/reset-password?token=tok',
    )
  })

  it('builds app deep links off the registered scheme', () => {
    expect(service().appLink('auth/reset-password', { token: 'a b' })).toBe(
      'connectqr://auth/reset-password?token=a%20b',
    )
    expect(service({ APP_LINK_BASE: 'https://connectqr.app/' }).appLink('auth/verified')).toBe(
      'https://connectqr.app/auth/verified',
    )
  })

  it('omits the query string when there are no params', () => {
    expect(service().appLink('auth/verified')).toBe('connectqr://auth/verified')
  })
})
