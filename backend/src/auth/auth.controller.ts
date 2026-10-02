import { Controller, Post, Body, Get, Delete, Param, Query, Res, UseGuards, Request } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { Response } from 'express'
import { AuthService } from './auth.service'
import { MailService } from './mail.service'
import { SessionContext } from './session-context'
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  VerifyEmailDto,
  ResetPasswordDto,
  MagicLinkVerifyDto,
  LoginCodeVerifyDto,
} from '../common/dto'
import { AuthenticatedRequest } from '../common/authenticated-request'

// Credential endpoints get a tight budget: 5 attempts/minute/IP is generous for
// a human and useless for password spraying.
const AUTH_THROTTLE = { default: { limit: 5, ttl: 60_000 } }

/** Pulls whatever device hints the client and platform gave us, for the session row. */
function sessionContext(req: AuthenticatedRequest): SessionContext {
  return {
    deviceLabel: typeof req.body?.deviceLabel === 'string' ? req.body.deviceLabel : undefined,
    userAgent: req.get('user-agent'),
    ipAddress: req.ip,
  }
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private mail: MailService,
  ) {}

  @Post('register')
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Create a new account' })
  register(@Body() dto: RegisterDto, @Request() req: AuthenticatedRequest) {
    return this.auth.register(dto.name, dto.email, dto.phone, dto.password, sessionContext(req))
  }

  @Post('login')
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Sign in with email and password' })
  login(@Body() dto: LoginDto, @Request() req: AuthenticatedRequest) {
    return this.auth.login(dto.email, dto.password, sessionContext(req))
  }

  @Post('forgot-password')
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Request a password reset' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email)
  }

  @Post('reset-password')
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Set a new password with a reset token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.password)
  }

  /**
   * The reset email links here rather than to the app so it works from any mail
   * client. It hands the token to the app and lets the user choose a password.
   */
  @Get('reset-password')
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Open the password reset screen from an email link' })
  resetPasswordFromLink(@Query('token') token: string, @Res() res: Response) {
    if (!token) return res.redirect(302, this.mail.appLink('auth/reset-password', { error: 'missing' }))
    return res.redirect(302, this.mail.appLink('auth/reset-password', { token }))
  }

  /**
   * Verification links are consumed here and the app is told whether it worked,
   * so the address is confirmed by opening the email, with no form to fill in.
   */
  @Get('verify-email')
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Confirm an email address from an email link' })
  async verifyEmailFromLink(@Query('token') token: string, @Res() res: Response) {
    try {
      await this.auth.verifyEmail(token)
      return res.redirect(302, this.mail.appLink('auth/verified', { status: 'ok' }))
    } catch {
      return res.redirect(302, this.mail.appLink('auth/verified', { status: 'invalid' }))
    }
  }

  @Post('verify-email')
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Confirm an email address with a verification token' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.token)
  }

  @Post('resend-verification')
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Re-send the verification email for an unverified address' })
  resendVerification(@Body() dto: ForgotPasswordDto) {
    return this.auth.resendVerification(dto.email)
  }

  @Post('magic-link')
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Email a single-use sign-in link and code' })
  async requestMagicLink(@Body() dto: ForgotPasswordDto) {
    return this.auth.requestMagicLink(dto.email)
  }

  /**
   * The emailed link points here: the mail client can always open an https URL,
   * and this hands the token to the app, which exchanges it for a session.
   */
  @Get('magic-link')
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Open the app from a passwordless sign-in link' })
  magicLinkFromLink(@Query('token') token: string, @Res() res: Response) {
    if (!token) {
      return res.redirect(302, this.mail.appLink('auth/magic-link', { error: 'missing' }))
    }
    return res.redirect(302, this.mail.appLink('auth/magic-link', { token }))
  }

  @Post('magic-link/verify')
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Exchange a sign-in link token for a session' })
  verifyMagicLink(@Body() dto: MagicLinkVerifyDto, @Request() req: AuthenticatedRequest) {
    return this.auth.verifyMagicLink(dto.token, sessionContext(req))
  }

  @Post('code/verify')
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Exchange the emailed 6-digit code for a session' })
  verifyLoginCode(@Body() dto: LoginCodeVerifyDto, @Request() req: AuthenticatedRequest) {
    return this.auth.verifyLoginCode(dto.email, dto.code, sessionContext(req))
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Exchange a valid token for a fresh one' })
  refresh(@Request() req: AuthenticatedRequest) {
    return this.auth.refresh(req.user.sub, sessionContext(req))
  }

  @Get('sessions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List the signed-in devices for this account' })
  listSessions(@Request() req: AuthenticatedRequest) {
    return this.auth.listSessions(req.user.sub, req.user.sid)
  }

  @Delete('sessions/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke one device session' })
  revokeSession(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.auth.revokeSession(req.user.sub, id, req.user.sid)
  }

  @Post('sessions/revoke-others')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sign out every device except this one' })
  revokeOtherSessions(@Request() req: AuthenticatedRequest) {
    return this.auth.revokeOtherSessions(req.user.sub, req.user.sid)
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'End the current session' })
  logout(@Request() req: AuthenticatedRequest) {
    return this.auth.logout(req.user.sid ?? '')
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current user profile' })
  me(@Request() req: AuthenticatedRequest) {
    return this.auth.findById(req.user.sub)
  }
}
