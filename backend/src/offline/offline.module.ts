import { Module } from '@nestjs/common';
import { OfflineController } from './offline.controller';
import { OfflineService } from './offline.service';
import { ConnectionsModule } from '../connections/connections.module';

@Module({
  imports: [ConnectionsModule],
  controllers: [OfflineController],
  providers: [OfflineService],
})
export class OfflineModule {}
