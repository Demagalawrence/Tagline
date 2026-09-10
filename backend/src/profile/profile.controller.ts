import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProfileService } from './profile.service';
import { UserProfile, PrivacySettings } from '../common/types';

@ApiTags('Profile')
@Controller('profile')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ProfileController {
  constructor(private profile: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req: any) {
    return this.profile.getProfile(req.user.sub);
  }

  @Patch()
  @ApiOperation({ summary: 'Update profile fields' })
  updateProfile(@Request() req: any, @Body() body: Partial<UserProfile>) {
    return this.profile.updateProfile(req.user.sub, body);
  }

  @Get('privacy')
  @ApiOperation({ summary: 'Get privacy settings' })
  getPrivacy(@Request() req: any) {
    return this.profile.getPrivacy(req.user.sub);
  }

  @Patch('privacy')
  @ApiOperation({ summary: 'Update privacy settings' })
  updatePrivacy(@Request() req: any, @Body() body: Partial<PrivacySettings>) {
    return this.profile.updatePrivacy(req.user.sub, body);
  }
}
