import { Body, Controller, Delete, Get, Param, Post, UseGuards, Request } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { IsOptional, IsString, Matches } from 'class-validator'
import { KeysService } from './keys.service'
import { AuthenticatedRequest } from '../common/authenticated-request'

export class RegisterKeyDto {
  /** base64url-encoded 32-byte Ed25519 public key. */
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{43}$/, { message: 'publicKey must be a base64url 32-byte Ed25519 key' })
  publicKey: string

  @IsOptional()
  @IsString()
  label?: string
}

@ApiTags('Device Keys')
@Controller('keys')
export class KeysController {
  constructor(private keys: KeysService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register this device public key for offline payload signing' })
  register(@Request() req: AuthenticatedRequest, @Body() dto: RegisterKeyDto) {
    return this.keys.register(req.user.sub, dto.publicKey, dto.label ?? '').then((k) => k.toDto())
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List device keys belonging to the current user' })
  async list(@Request() req: AuthenticatedRequest) {
    const rows = await this.keys.listForUser(req.user.sub)
    return rows.map((k) => k.toDto())
  }

  /**
   * Public by design: a scanner needs the public key to verify a payload it
   * just read, and a public key is not a secret.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Fetch a device public key to verify an offline payload' })
  async get(@Param('id') id: string) {
    const key = await this.keys.findById(id)
    return { id: key.id, publicKey: key.publicKey, status: key.status }
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a device key' })
  async revoke(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    const key = await this.keys.revoke(req.user.sub, id)
    return key.toDto()
  }
}
