import { Module } from '@nestjs/common'
import { QrController } from './qr.controller'
import { QrService } from './qr.service'
import { ProfileModule } from '../profile/profile.module'
import { KeysModule } from '../keys/keys.module'

@Module({
  imports: [ProfileModule, KeysModule],
  controllers: [QrController],
  providers: [QrService],
})
export class QrModule {}
