import { ApiProperty } from '@nestjs/swagger'
import {
  ArrayMaxSize,
  IsOptional,
  IsArray,
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator'

const PHONE_REGEX = /^\+[1-9]\d{7,14}$/

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  name: string

  /** Optional device hint so the session list can name this sign-in. */
  @ApiProperty({ example: 'Pixel 8 (Android)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  deviceLabel?: string

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string

  @ApiProperty({ example: '+256700123456' })
  @IsString()
  @Matches(PHONE_REGEX, { message: 'Enter a valid international number' })
  phone: string

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string
}

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string

  /** Optional device hint so the session list can name this sign-in. */
  @ApiProperty({ example: 'Pixel 8 (Android)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  deviceLabel?: string
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string
}

export class MagicLinkVerifyDto {
  @ApiProperty({ example: '9f2c1a7e4b8d0356' })
  @IsString()
  @MinLength(16)
  @MaxLength(128)
  token: string

  /** Optional device hint so the session list can name this sign-in. */
  @ApiProperty({ example: 'Pixel 8 (Android)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  deviceLabel?: string
}

export class LoginCodeVerifyDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string

  /** Exactly 6 digits: the code is generated as a zero-padded 6-character string. */
  @ApiProperty({ example: '042917' })
  @Matches(/^\d{6}$/, { message: 'Enter the 6-digit code from your email' })
  code: string

  /** Optional device hint so the session list can name this sign-in. */
  @ApiProperty({ example: 'Pixel 8 (Android)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  deviceLabel?: string
}

export class VerifyEmailDto {
  @ApiProperty({ example: '5f9d0b1a4e2c2a1f…' })
  @IsString()
  @MinLength(8)
  token: string
}

export class ResetPasswordDto {
  @ApiProperty({ example: '5f9d0b1a4e2c2a1f…' })
  @IsString()
  @MinLength(8)
  token: string

  @ApiProperty({ example: 'newpassword123' })
  @IsString()
  @MinLength(6)
  password: string
}

export class UpdateTagsDto {
  @ApiProperty({ example: ['Work', 'Met at expo'], type: [String] })
  @IsArray()
  // A generous ceiling on input; the service dedupes, trims and caps the result,
  // so repeated or near-duplicate tags are normalized rather than rejected.
  @ArrayMaxSize(24)
  @IsString({ each: true })
  @MaxLength(24, { each: true })
  tags: string[]
}
