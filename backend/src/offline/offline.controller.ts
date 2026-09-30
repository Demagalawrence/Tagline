import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { OfflineService } from './offline.service'
import { AuthenticatedRequest } from '../common/authenticated-request'

class StartSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  networkName?: string
}

class AnnouncePeerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string

  @IsString()
  @MinLength(8)
  sessionToken: string

  @IsOptional()
  @IsString()
  avatar?: string
}

@ApiTags('Offline')
@Controller('offline')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class OfflineController {
  constructor(private offline: OfflineService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start an offline sharing session' })
  start(@Request() req: AuthenticatedRequest, @Body() dto: StartSessionDto) {
    return this.offline.startSession(req.user.sub, dto.networkName)
  }

  @Delete('stop')
  @ApiOperation({ summary: 'Stop the active offline session' })
  stop(@Request() req: AuthenticatedRequest) {
    return this.offline.stopSession(req.user.sub)
  }

  @Get('session')
  @ApiOperation({ summary: 'Get the current offline session and live peers' })
  getSession(@Request() req: AuthenticatedRequest) {
    return this.offline.getSession(req.user.sub)
  }

  @Post('peers')
  @ApiOperation({
    summary: 'Announce this device as a peer on the local network',
  })
  announce(@Request() req: AuthenticatedRequest, @Body() dto: AnnouncePeerDto) {
    return this.offline.announcePeer(req.user.sub, dto)
  }

  @Get('peers')
  @ApiOperation({ summary: 'List devices currently sharing on this session' })
  listPeers(@Request() req: AuthenticatedRequest) {
    return this.offline.getPeers(req.user.sub).map(({ lastSeenMs: _omit, ...p }) => p)
  }

  @Delete('peers/:id')
  @ApiOperation({ summary: 'Remove a peer from the session' })
  removePeer(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return { removed: this.offline.removePeer(req.user.sub, id) }
  }
}
