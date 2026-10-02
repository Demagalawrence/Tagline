import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { AuthService } from './auth.service'

@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name)

  constructor(private readonly auth: AuthService) {}

  /**
   * Session rows are kept (rather than deleted) when revoked so the device list
   * can show history, which means expired rows accumulate. Once a row is past
   * `expiresAt` it can neither authenticate nor be useful history, so drop it
   * daily. `unref` is unnecessary here: Nest owns the process lifetime.
   */
  @Cron('0 3 * * *')
  async purgeExpired(): Promise<void> {
    const removed = await this.auth.purgeExpiredSessions()
    if (removed > 0) this.logger.log(`Purged ${removed} expired session(s)`)
  }
}
