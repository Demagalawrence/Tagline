import { Controller, Delete, Get, UseGuards, Request, HttpCode } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { AccountService } from './account.service'
import { AuthenticatedRequest } from '../common/authenticated-request'

@ApiTags('Account')
@Controller('account')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AccountController {
  constructor(private account: AccountService) {}

  @Get('export')
  @ApiOperation({ summary: 'Export all of your data as JSON' })
  export(@Request() req: AuthenticatedRequest) {
    return this.account.exportData(req.user.sub)
  }

  @Delete()
  @HttpCode(200)
  @ApiOperation({ summary: 'Permanently delete your account and all associated data' })
  remove(@Request() req: AuthenticatedRequest) {
    return this.account.deleteAccount(req.user.sub)
  }
}
