import { BadRequestException } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { MailService } from './mail.service'

type FakeResponse = { redirect: jest.Mock }

function response(): FakeResponse {
  return { redirect: jest.fn() }
}

describe('AuthController email links', () => {
  let controller: AuthController
  let auth: {
    verifyEmail: jest.Mock
    resetPassword: jest.Mock
    forgotPassword: jest.Mock
    login: jest.Mock
    register: jest.Mock
    resendVerification: jest.Mock
    refresh: jest.Mock
    findById: jest.Mock
  }
  let mail: { appLink: jest.Mock }

  beforeEach(() => {
    auth = {
      verifyEmail: jest.fn(),
      resetPassword: jest.fn(),
      forgotPassword: jest.fn(),
      login: jest.fn(),
      register: jest.fn(),
      resendVerification: jest.fn(),
      refresh: jest.fn(),
      findById: jest.fn(),
    }
    mail = { appLink: jest.fn((path: string) => `connectqr://${path}`) }
    controller = new AuthController(auth as never, mail as unknown as MailService)
  })

  describe('verifyEmailFromLink', () => {
    it('consumes the token and redirects into the app on success', async () => {
      auth.verifyEmail.mockResolvedValue({ verified: true })
      const res = response()

      await controller.verifyEmailFromLink('tok_abc', res as never)

      expect(auth.verifyEmail).toHaveBeenCalledWith('tok_abc')
      expect(mail.appLink).toHaveBeenCalledWith('auth/verified', { status: 'ok' })
      expect(res.redirect).toHaveBeenCalledWith(302, 'connectqr://auth/verified')
    })

    it('redirects with an invalid status instead of throwing at the mail client', async () => {
      auth.verifyEmail.mockRejectedValue(new BadRequestException('Invalid token'))
      const res = response()

      await controller.verifyEmailFromLink('stale', res as never)

      expect(mail.appLink).toHaveBeenCalledWith('auth/verified', { status: 'invalid' })
      expect(res.redirect).toHaveBeenCalledWith(302, 'connectqr://auth/verified')
    })
  })

  describe('resetPasswordFromLink', () => {
    it('hands the token to the app reset screen', () => {
      const res = response()

      controller.resetPasswordFromLink('tok_reset', res as never)

      expect(mail.appLink).toHaveBeenCalledWith('auth/reset-password', { token: 'tok_reset' })
      expect(res.redirect).toHaveBeenCalledWith(302, 'connectqr://auth/reset-password')
    })

    it('flags a link with no token rather than opening an empty form silently', () => {
      const res = response()

      controller.resetPasswordFromLink('', res as never)

      expect(mail.appLink).toHaveBeenCalledWith('auth/reset-password', { error: 'missing' })
    })
  })
})
