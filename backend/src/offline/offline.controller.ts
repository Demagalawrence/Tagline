import { Controller, Get, Post, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OfflineService } from './offline.service';

@ApiTags('Offline')
@Controller('offline')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class OfflineController {
  constructor(private offline: OfflineService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start an offline sharing session' })
  start(@Request() req: any) {
    return this.offline.startSession(req.user.sub);
  }

  @Delete('stop')
  @ApiOperation({ summary: 'Stop the active offline session' })
  stop(@Request() req: any) {
    return this.offline.stopSession(req.user.sub);
  }

  @Get('session')
  @ApiOperation({ summary: 'Get the current offline session' })
  getSession(@Request() req: any) {
    return this.offline.getSession(req.user.sub);
  }
}
