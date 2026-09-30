/**
 * Startup safety checks.
 *
 * The default dev JWT secret is a known string, so booting production with it
 * would let anyone mint valid tokens. Failing fast is the only reliable
 * mitigation, which is why this runs from the AppModule constructor.
 */

const INSECURE_SECRETS = new Set([
  'connectqr-dev-secret',
  'connectqr-dev-secret-change-in-production',
  'change-me',
  'secret',
])

const MIN_SECRET_LENGTH = 32

export interface ConfigEnv {
  NODE_ENV?: string
  JWT_SECRET?: string
  CORS_ORIGIN?: string
  OFFLINE_SIGNING_PRIVATE_KEY?: string
}

export function assertSecureConfig(env: ConfigEnv): void {
  if (env.NODE_ENV !== 'production') return

  const secret = env.JWT_SECRET ?? ''

  if (!secret) {
    throw new Error(
      'JWT_SECRET is required when NODE_ENV=production. Refusing to start with an unsigned token surface.',
    )
  }
  if (INSECURE_SECRETS.has(secret)) {
    throw new Error(
      'JWT_SECRET is set to a known development value. Refusing to start; generate a unique secret.',
    )
  }
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters in production.`,
    )
  }

  if (env.CORS_ORIGIN === '*') {
    throw new Error(
      'CORS_ORIGIN must list explicit origins in production instead of "*".',
    )
  }
}
