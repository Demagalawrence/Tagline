import { Global, Module } from '@nestjs/common'
import { SigningService } from './signing.service'

@Global()
@Module({
  providers: [SigningService],
  exports: [SigningService],
})
export class SigningModule {}
