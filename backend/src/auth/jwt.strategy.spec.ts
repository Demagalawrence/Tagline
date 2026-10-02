import { ConfigService } from '@nestjs/config'
import { UnauthorizedException } from '@nestjs/common'
import { JwtStrategy, JwtPayload } from './jwt.strategy'

describe('JwtStrategy', () => {
  const cfg = { get: jest.fn((_k: string, fallback: string) => fallback) } as unknown as ConfigService

  const makeStrategy = (isSessionActive: jest.Mock) =>
    new JwtStrategy(cfg, { isSessionActive } as never)

  it('passes the subject and session id through to the guard', async () => {
    const strategy = makeStrategy(jest.fn().mockResolvedValue(true))
    const payload: JwtPayload = { sub: 'usr_1', iat: 1, jti: 'ses_1' }

    await expect(strategy.validate(payload)).resolves.toEqual({ sub: 'usr_1', sid: 'ses_1' })
  })

  it('rejects a token whose session was revoked', async () => {
    const isSessionActive = jest.fn().mockResolvedValue(false)
    const strategy = makeStrategy(isSessionActive)

    await expect(strategy.validate({ sub: 'usr_1', iat: 1, jti: 'ses_revoked' })).rejects.toThrow(
      UnauthorizedException,
    )
    expect(isSessionActive).toHaveBeenCalledWith('ses_revoked')
  })

  it('accepts a legacy token with no jti, since it predates session tracking', async () => {
    const isSessionActive = jest.fn()
    const strategy = makeStrategy(isSessionActive)

    await expect(strategy.validate({ sub: 'usr_1', iat: 1 })).resolves.toEqual({
      sub: 'usr_1',
      sid: undefined,
    })
    expect(isSessionActive).not.toHaveBeenCalled()
  })
})
