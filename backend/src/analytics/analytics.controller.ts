import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { IsObject, IsOptional, IsString, Matches, MaxLength } from 'class-validator'
import { AnalyticsService } from './analytics.service'
import { AuthenticatedRequest } from '../common/authenticated-request'

class TrackEventDto {
  @IsString()
  @MaxLength(64)
  @Matches(/^[a-z0-9_.:-]+$/i, { message: 'name must be a simple event identifier' })
  name: string

  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>

  @IsOptional()
  @IsString()
  platform?: string

  @IsOptional()
  @IsString()
  appVersion?: string
}

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Post('events')
  @ApiOperation({ summary: 'Capture a product analytics event' })
  track(@Request() req: AuthenticatedRequest, @Body() dto: TrackEventDto) {
    return this.analytics
      .track({
        name: dto.name,
        // Analytics must work for signed-out users too, so the guard is
        // intentionally absent here; userId is simply null when unknown.
        userId: req.user?.sub,
        properties: dto.properties,
        platform: dto.platform,
        appVersion: dto.appVersion,
      })
      .then((e) => e.toDto())
  }

  @Get('summary')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Event totals for the last N days' })
  summary() {
    return this.analytics.summary()
  }
}
