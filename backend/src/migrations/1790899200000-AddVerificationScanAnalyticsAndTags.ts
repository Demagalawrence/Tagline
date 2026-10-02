import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Adds email verification, password reset, QR scan analytics, and connection
 * tags.
 *
 * The statements are written with IF NOT EXISTS on purpose. Development
 * databases were originally built with `DB_SYNCHRONIZE=true`, so some of these
 * columns already exist there while the `migrations` table does not. A plain
 * ADD COLUMN would abort the whole migration on such a database; this way the
 * same migration is safe to apply to a clean database and to an existing one.
 */
export class AddVerificationScanAnalyticsAndTags1790899200000 implements MigrationInterface {
  name = 'AddVerificationScanAnalyticsAndTags1790899200000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerified" boolean NOT NULL DEFAULT false`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verificationToken" character varying`,
    )
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resetToken" character varying`)
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resetTokenExpiresAt" TIMESTAMP`)
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verificationTokenExpiresAt" TIMESTAMP`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "scanCount" integer NOT NULL DEFAULT 0`,
    )
    // Counts codes this account scanned, as opposed to scanCount, which counts
    // scans of this account's own code.
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "scansPerformed" integer NOT NULL DEFAULT 0`,
    )
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastScannedAt" TIMESTAMP`)

    // Both tokens are looked up by value on every verify and reset request, and
    // the columns are mostly null, so a plain btree index is the right shape.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_verificationToken" ON "users" ("verificationToken")`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_resetToken" ON "users" ("resetToken")`,
    )

    await queryRunner.query(
      `ALTER TABLE "connections" ADD COLUMN IF NOT EXISTS "tags" text array NOT NULL DEFAULT '{}'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_resetToken"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_verificationToken"`)
    await queryRunner.query(`ALTER TABLE "connections" DROP COLUMN IF EXISTS "tags"`)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "lastScannedAt"`)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "scanCount"`)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "scansPerformed"`)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "resetTokenExpiresAt"`)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "resetToken"`)
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "verificationTokenExpiresAt"`,
    )
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "verificationToken"`)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "emailVerified"`)
  }
}
