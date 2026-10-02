import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './jwt.strategy'
import { MailService } from './mail.service'
import { User } from '../entities/user.entity'
import { AuthSession } from '../entities/auth-session.entity'
import { SessionCleanupService } from './session-cleanup.service'

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([User, AuthSession]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get('JWT_SECRET', 'connectqr-dev-secret'),
        signOptions: { expiresIn: cfg.get('JWT_EXPIRES_IN', '7d') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, MailService, JwtStrategy, SessionCleanupService],
  exports: [AuthService],
})
export class AuthModule {}
