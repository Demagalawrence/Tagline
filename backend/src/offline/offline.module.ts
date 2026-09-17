import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfflineController } from './offline.controller';
import { OfflineService } from './offline.service';
import { ConnectionsModule } from '../connections/connections.module';
import { OfflineSession } from '../entities/offline-session.entity';

@Module({
  imports: [ConnectionsModule, TypeOrmModule.forFeature([OfflineSession])],
  controllers: [OfflineController],
  providers: [OfflineService],
})
export class OfflineModule {}