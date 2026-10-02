import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Passwordless sign-in: a single-use token for the emailed link plus a bcrypt
 * hash of the emailed 6-digit code, sharing one expiry.
 */
export class AddPasswordlessLogin1790905600000 implements MigrationInterface {
  name = 'AddPasswordlessLogin1790905600000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "loginToken" character varying`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "loginCodeHash" character varying`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "loginTokenExpiresAt" TIMESTAMP`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_loginToken" ON "users" ("loginToken")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_loginToken"`)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "loginTokenExpiresAt"`)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "loginCodeHash"`)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "loginToken"`)
  }
}
