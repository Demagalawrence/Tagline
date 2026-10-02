import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'

export interface JwtPayload {
  sub: string
  iat: number
  /** Session id; absent on tokens issued before session management existed. */
  jti?: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    cfg: ConfigService,
    private readonly auth: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: cfg.get('JWT_SECRET', 'connectqr-dev-secret'),
    })
  }

  async validate(payload: JwtPayload) {
    // A signature only proves the token was ours. The session row decides
    // whether it is still allowed to act, which is what makes sign-out and
    // "revoke this device" take effect before the token expires.
    if (payload.jti && !(await this.auth.isSessionActive(payload.jti))) {
      throw new UnauthorizedException('Session has been revoked')
    }
    return { sub: payload.sub, sid: payload.jti }
  }
}
