import { assertSecureConfig } from './validate'

describe('assertSecureConfig', () => {
  const prod = { NODE_ENV: 'production' }
  const strongSecret = 'a'.repeat(48)

  it('does nothing outside production', () => {
    expect(() =>
      assertSecureConfig({ NODE_ENV: 'development', JWT_SECRET: 'change-me' }),
    ).not.toThrow()
    expect(() => assertSecureConfig({ NODE_ENV: 'test' })).not.toThrow()
    expect(() => assertSecureConfig({})).not.toThrow()
  })

  it('rejects a missing secret in production', () => {
    expect(() => assertSecureConfig(prod)).toThrow(/JWT_SECRET is required/)
  })

  it('rejects the known development secrets', () => {
    for (const secret of [
      'connectqr-dev-secret',
      'connectqr-dev-secret-change-in-production',
      'change-me',
      'secret',
    ]) {
      expect(() => assertSecureConfig({ ...prod, JWT_SECRET: secret })).toThrow(
        /known development value/,
      )
    }
  })

  it('rejects a secret that is too short', () => {
    expect(() => assertSecureConfig({ ...prod, JWT_SECRET: 'a'.repeat(31) })).toThrow(
      /at least 32 characters/,
    )
  })

  it('rejects a wildcard CORS origin in production', () => {
    expect(() =>
      assertSecureConfig({ ...prod, JWT_SECRET: strongSecret, CORS_ORIGIN: '*' }),
    ).toThrow(/explicit origins/)
  })

  it('accepts an explicit origin list in production', () => {
    expect(() =>
      assertSecureConfig({
        ...prod,
        JWT_SECRET: strongSecret,
        CORS_ORIGIN: 'https://connectqr.app,https://app.connectqr.app',
      }),
    ).not.toThrow()
  })

  it('accepts a strong production config', () => {
    expect(() =>
      assertSecureConfig({
        ...prod,
        JWT_SECRET: strongSecret,
        CORS_ORIGIN: 'https://connectqr.app',
      }),
    ).not.toThrow()
  })
})
