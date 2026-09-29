import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { ConnectionsService } from './connections.service'
import { ScannedContact } from '../common/types'
import { AuthenticatedRequest } from '../common/authenticated-request'

@ApiTags('Connections')
@Controller('connections')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ConnectionsController {
  constructor(private connections: ConnectionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get recent connections' })
  getRecent(@Request() req: AuthenticatedRequest) {
    return this.connections.getRecent(req.user.sub)
  }

  @Post()
  @ApiOperation({ summary: 'Save a scanned contact as a connection' })
  save(@Request() req: AuthenticatedRequest, @Body() body: ScannedContact) {
    return this.connections.save(req.user.sub, body)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a connection' })
  delete(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.connections.delete(req.user.sub, id)
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby offline devices' })
  getNearby(@Request() req: AuthenticatedRequest) {
    return this.connections.getNearbyDevices(req.user.sub)
  }
}
