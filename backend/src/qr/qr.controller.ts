import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IsIn, IsString } from 'class-validator';
import { QrService } from './qr.service';
import { ProfileService } from '../profile/profile.service';
import { QRType } from '../common/types';

class GenerateQrDto {
  @IsIn(['whatsapp', 'profile', 'offline'])
  type: QRType;
}

class ParseQrDto {
  @IsString()
  payload: string;
}

@ApiTags('QR')
@Controller('qr')
export class QrController {
  constructor(private qr: QrService, private profile: ProfileService) {}

  @Post('generate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a QR payload for the current user' })
  async generate(@Request() req: any, @Body() body: GenerateQrDto) {
    const user = await this.profile.getProfile(req.user.sub);
    const privacy = await this.profile.getPrivacy(req.user.sub);
    return { payload: this.qr.generatePayload(user, body.type, privacy) };
  }

  @Post('parse')
  @ApiOperation({ summary: 'Parse a scanned QR payload into a contact' })
  parse(@Body() body: ParseQrDto) {
    return this.qr.parseScannedPayload(body.payload);
  }
}
