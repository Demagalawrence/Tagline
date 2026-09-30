/**
 * Error reporting hook.
 *
 * Crash reporting is kept behind a small registry rather than an import of a
 * reporting SDK. Sentry (and similar SDKs) are native modules, so importing one
 * unconditionally would break the app in Expo Go and in CI where the native
 * build is absent. With this indirection the app compiles and runs everywhere,
 * and a build that includes the SDK just registers a reporter at startup.
 *
 * To wire Sentry up in a development build:
 *   import * as Sentry from '@sentry/react-native'
 *   import { setErrorReporter } from '@/services/errorReporting'
 *   Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN })
 *   setErrorReporter((error, context) => Sentry.captureException(error, context))
 */

export interface ErrorContext {
  screen?: string
  action?: string
  [key: string]: unknown
}

type Reporter = (error: unknown, context?: ErrorContext) => void

let reporter: Reporter | null = null
const queue: Array<{ error: unknown; context?: ErrorContext }> = []

/** Register the active reporter. Any errors captured before this are flushed. */
export function setErrorReporter(next: Reporter | null): void {
  reporter = next
  if (!next) return
  const pending = queue.splice(0, queue.length)
  for (const item of pending) {
    try {
      next(item.error, item.context)
    } catch {
      // A failing reporter must never break the app.
    }
  }
}

export const isErrorReportingEnabled = (): boolean => reporter !== null

/**
 * Record a handled error. Safe to call before a reporter is registered: early
 * errors are buffered rather than dropped.
 */
export function reportError(error: unknown, context?: ErrorContext): void {
  if (!reporter) {
    // Bound the buffer so a crash loop cannot grow it without limit.
    if (queue.length < 25) queue.push({ error, context })
    return
  }
  try {
    reporter(error, context)
  } catch {
    // Never let reporting crash the caller.
  }
}
