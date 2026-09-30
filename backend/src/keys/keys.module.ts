import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DeviceKey } from '../entities/device-key.entity'
import { KeysController } from './keys.controller'
import { KeysService } from './keys.service'

@Module({
  imports: [TypeOrmModule.forFeature([DeviceKey])],
  controllers: [KeysController],
  providers: [KeysService],
  exports: [KeysService],
})
export class KeysModule {}
