import 'dotenv/config'
import { DataSource } from 'typeorm'
import { User } from './entities/user.entity'
import { Connection } from './entities/connection.entity'
import { OfflineSession } from './entities/offline-session.entity'

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'connectqr',
  password: process.env.DB_PASSWORD ?? 'connectqr',
  database: process.env.DB_NAME ?? 'connectqr',
  entities: [User, Connection, OfflineSession],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
  // Schema changes must go through migrations; never auto-sync from the CLI.
  synchronize: false,
})

export default AppDataSource
