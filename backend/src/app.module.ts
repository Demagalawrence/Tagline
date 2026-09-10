import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { QrModule } from './qr/qr.module';
import { ConnectionsModule } from './connections/connections.module';
import { OfflineModule } from './offline/offline.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    ProfileModule,
    QrModule,
    ConnectionsModule,
    OfflineModule,
  ],
})
export class AppModule {}
