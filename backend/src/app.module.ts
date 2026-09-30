import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThrottlerModule } from '@nestjs/throttler'
import { join } from 'path'
import { AuthModule } from './auth/auth.module'
import { ProfileModule } from './profile/profile.module'
import { QrModule } from './qr/qr.module'
import { ConnectionsModule } from './connections/connections.module'
import { OfflineModule } from './offline/offline.module'
import { KeysModule } from './keys/keys.module'
import { SigningModule } from './signing/signing.module'
import { AnalyticsModule } from './analytics/analytics.module'
import { HealthModule } from './health/health.module'
import { AccountModule } from './account/account.module'
import { assertSecureConfig } from './config/validate'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        // Generous ceiling for normal browsing; /auth/* gets a much tighter
        // limit via @Throttle on the controller, since those are the endpoints
        // worth brute-forcing.
        ttl: 60_000,
        limit: 120,
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const databaseUrl = cfg.get<string>('DATABASE_URL')
        const runMigrations = cfg.get<string>('DB_RUN_MIGRATIONS', 'false') === 'true'
        const nodeEnv = cfg.get<string>('NODE_ENV', 'development')

        return {
          type: 'postgres' as const,
          url: databaseUrl,
          host: cfg.get<string>('DB_HOST', 'localhost'),
          port: cfg.get<number>('DB_PORT', 5432),
          username: cfg.get<string>('DB_USER', 'connectqr'),
          password: cfg.get<string>('DB_PASSWORD', 'connectqr'),
          database: cfg.get<string>('DB_NAME', 'connectqr'),
          autoLoadEntities: true,
          // Schema is owned by migrations. `synchronize` is opt-in and refused
          // in production, because auto-syncing a live database drops columns
          // that no longer appear in an entity.
          synchronize:
            nodeEnv !== 'production' &&
            cfg.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
          migrationsRun: runMigrations,
          migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
        }
      },
    }),
    SigningModule,
    HealthModule,
    AuthModule,
    ProfileModule,
    QrModule,
    ConnectionsModule,
    OfflineModule,
    KeysModule,
    AnalyticsModule,
    AccountModule,
  ],
})
export class AppModule {
  constructor() {
    assertSecureConfig(process.env)
  }
}
