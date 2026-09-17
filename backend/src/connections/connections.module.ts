import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';
import { Connection } from '../entities/connection.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Connection])],
  controllers: [ConnectionsController],
  providers: [ConnectionsService],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}