import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { QrModule } from './qr/qr.module';
import { ConnectionsModule } from './connections/connections.module';
import { OfflineModule } from './offline/offline.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const databaseUrl = cfg.get<string>('DATABASE_URL');
        return {
          type: 'postgres' as const,
          url: databaseUrl,
          host: cfg.get<string>('DB_HOST', 'localhost'),
          port: cfg.get<number>('DB_PORT', 5432),
          username: cfg.get<string>('DB_USER', 'connectqr'),
          password: cfg.get<string>('DB_PASSWORD', 'connectqr'),
          database: cfg.get<string>('DB_NAME', 'connectqr'),
          autoLoadEntities: true,
          synchronize: cfg.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
        };
      },
    }),
    AuthModule,
    ProfileModule,
    QrModule,
    ConnectionsModule,
    OfflineModule,
  ],
})
export class AppModule {}