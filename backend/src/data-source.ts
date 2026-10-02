import 'dotenv/config'
import { DataSource } from 'typeorm'
import { User } from './entities/user.entity'
import { Connection } from './entities/connection.entity'
import { OfflineSession } from './entities/offline-session.entity'
import { DeviceKey } from './entities/device-key.entity'
import { AnalyticsEvent } from './entities/analytics-event.entity'
import { AuthSession } from './entities/auth-session.entity'

// Exactly one DataSource export: the TypeORM CLI refuses a data source file
// that also re-exports the same instance as default.
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'connectqr',
  password: process.env.DB_PASSWORD ?? 'connectqr',
  database: process.env.DB_NAME ?? 'connectqr',
  entities: [User, Connection, OfflineSession, DeviceKey, AnalyticsEvent, AuthSession],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
  // Schema changes must go through migrations; never auto-sync from the CLI.
  synchronize: false,
})
