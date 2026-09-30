import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from '../entities/user.entity'
import { Connection } from '../entities/connection.entity'
import { OfflineSession } from '../entities/offline-session.entity'
import { DeviceKey } from '../entities/device-key.entity'
import { AccountController } from './account.controller'
import { AccountService } from './account.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Connection, OfflineSession, DeviceKey]),
  ],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
