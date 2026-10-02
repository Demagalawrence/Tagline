import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { ConnectionsService } from './connections.service'
import { ScannedContact } from '../common/types'
import { UpdateTagsDto } from '../common/dto'
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

  @Patch(':id/tags')
  @ApiOperation({ summary: 'Replace the tags on a connection' })
  async setTags(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTagsDto,
  ) {
    const updated = await this.connections.setTags(req.user.sub, id, dto.tags)
    if (!updated) throw new NotFoundException('Connection not found')
    return updated
  }

  @Get('tags')
  @ApiOperation({ summary: 'List the tags in use, with counts' })
  getTags(@Request() req: AuthenticatedRequest) {
    return this.connections.getTagSummary(req.user.sub)
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby offline devices' })
  getNearby(@Request() req: AuthenticatedRequest) {
    return this.connections.getNearbyDevices(req.user.sub)
  }

  @Get('activity')
  @ApiOperation({ summary: 'Recent connections and account-level activity' })
  getActivity(@Request() req: AuthenticatedRequest) {
    return this.connections.getActivity(req.user.sub)
  }
}
