import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { AuthService } from './auth.service'
import { RegisterDto, LoginDto, ForgotPasswordDto } from '../common/dto'
import { AuthenticatedRequest } from '../common/authenticated-request'

// Credential endpoints get a tight budget: 5 attempts/minute/IP is generous for
// a human and useless for password spraying.
const AUTH_THROTTLE = { default: { limit: 5, ttl: 60_000 } }

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Create a new account' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.name, dto.email, dto.phone, dto.password)
  }

  @Post('login')
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Sign in with email and password' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password)
  }

  @Post('forgot-password')
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Request a password reset' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email)
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Exchange a valid token for a fresh one' })
  refresh(@Request() req: AuthenticatedRequest) {
    return this.auth.refresh(req.user.sub)
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current user profile' })
  me(@Request() req: AuthenticatedRequest) {
    return this.auth.findById(req.user.sub)
  }
}
