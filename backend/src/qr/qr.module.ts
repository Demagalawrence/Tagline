import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { QrController } from './qr.controller'
import { QrService } from './qr.service'
import { ProfileModule } from '../profile/profile.module'
import { KeysModule } from '../keys/keys.module'
import { AnalyticsModule } from '../analytics/analytics.module'
import { User } from '../entities/user.entity'

@Module({
  imports: [ProfileModule, KeysModule, AnalyticsModule, TypeOrmModule.forFeature([User])],
  controllers: [QrController],
  providers: [QrService],
})
export class QrModule {}
