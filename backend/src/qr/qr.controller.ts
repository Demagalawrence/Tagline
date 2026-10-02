import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { IsIn, IsOptional, IsString } from 'class-validator'
import { QrService } from './qr.service'
import { ProfileService } from '../profile/profile.service'
import { AuthenticatedRequest } from '../common/authenticated-request'

export type QrOutputType =
  | 'whatsapp'
  | 'profile'
  | 'offline'
  | 'vcard'
  | 'mecard'

class GenerateQrDto {
  @IsIn(['whatsapp', 'profile', 'offline', 'vcard', 'mecard'])
  type: QrOutputType

  /** Device key id to embed in offline payloads so scanners can verify them. */
  @IsOptional()
  @IsString()
  deviceKeyId?: string
}

class ParseQrDto {
  @IsString()
  payload: string
}

@ApiTags('QR')
@Controller('qr')
export class QrController {
  constructor(
    private qr: QrService,
    private profile: ProfileService,
  ) {}

  @Post('generate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a QR payload for the current user' })
  async generate(@Request() req: AuthenticatedRequest, @Body() body: GenerateQrDto) {
    const user = await this.profile.getProfile(req.user.sub)
    const privacy = await this.profile.getPrivacy(req.user.sub)

    if (body.type === 'offline') {
      return {
        payload: await this.qr.buildOfflinePayload(
          user,
          privacy,
          body.deviceKeyId,
        ),
      }
    }

    return { payload: this.qr.generatePayload(user, body.type, privacy) }
  }

  /**
   * Returns the exact bytes a device must sign for an offline payload, so the
   * private key never has to leave the phone.
   */
  @Post('offline/unsigned')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Build an unsigned offline payload for device-side signing' })
  async unsignedOffline(@Request() req: AuthenticatedRequest, @Body() body: GenerateQrDto) {
    const user = await this.profile.getProfile(req.user.sub)
    const privacy = await this.profile.getPrivacy(req.user.sub)
    return this.qr.buildUnsignedOfflinePayload(user, privacy, body.deviceKeyId)
  }

  @Post('parse')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Parse a scanned QR payload into a contact' })
  parse(@Request() req: AuthenticatedRequest, @Body() body: ParseQrDto) {
    return this.qr.parseScannedPayload(body.payload, req.user.sub)
  }
}
