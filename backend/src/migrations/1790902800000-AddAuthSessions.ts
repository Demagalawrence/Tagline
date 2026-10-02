import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Backs session management: one row per issued JWT, keyed by the token's `jti`
 * claim, so a revoked token can be rejected before it expires.
 */
export class AddAuthSessions1790902800000 implements MigrationInterface {
  name = 'AddAuthSessions1790902800000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "auth_sessions" (
      "id" character varying NOT NULL,
      "userId" character varying NOT NULL,
      "deviceLabel" character varying NOT NULL DEFAULT 'Unknown device',
      "userAgent" text,
      "ipAddress" text,
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      "lastUsedAt" TIMESTAMP,
      "expiresAt" TIMESTAMP NOT NULL,
      "revokedAt" TIMESTAMP,
      CONSTRAINT "PK_auth_sessions" PRIMARY KEY ("id")
    )`)

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_auth_sessions_userId" ON "auth_sessions" ("userId")`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_auth_sessions_userId_expiresAt" ON "auth_sessions" ("userId", "expiresAt")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_auth_sessions_userId_expiresAt"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_auth_sessions_userId"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "auth_sessions"`)
  }
}
