import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Initial schema: users, connections, offline_sessions, device_keys,
 * analytics_events.
 *
 * Written by hand to match the entity definitions exactly so the schema is
 * reproducible from a clean database without relying on `synchronize`.
 */
export class InitialSchema1735000000000 implements MigrationInterface {
  name = 'InitialSchema1735000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" character varying NOT NULL,
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "phone" character varying NOT NULL DEFAULT '',
        "whatsapp" character varying NOT NULL DEFAULT '',
        "bio" character varying NOT NULL DEFAULT '',
        "avatar" character varying,
        "title" character varying,
        "company" character varying,
        "location" character varying,
        "website" character varying,
        "passwordHash" character varying NOT NULL,
        "showPhone" boolean NOT NULL DEFAULT true,
        "showWhatsapp" boolean NOT NULL DEFAULT true,
        "showPhoto" boolean NOT NULL DEFAULT true,
        "allowDiscovery" boolean NOT NULL DEFAULT true,
        "allowOfflineSharing" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email")`,
    )

    await queryRunner.query(`
      CREATE TABLE "connections" (
        "id" character varying NOT NULL,
        "userId" character varying NOT NULL,
        "name" character varying NOT NULL,
        "phone" character varying NOT NULL DEFAULT '',
        "whatsapp" character varying NOT NULL DEFAULT '',
        "bio" character varying,
        "avatar" character varying,
        "title" character varying,
        "company" character varying,
        "email" character varying,
        "scannedAt" TIMESTAMP NOT NULL,
        "type" character varying NOT NULL DEFAULT 'unknown',
        "rawPayload" character varying NOT NULL DEFAULT '',
        CONSTRAINT "PK_connections_id" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(
      `CREATE INDEX "IDX_connections_userId" ON "connections" ("userId")`,
    )

    await queryRunner.query(`
      CREATE TABLE "offline_sessions" (
        "id" character varying NOT NULL,
        "userId" character varying NOT NULL,
        "networkName" character varying NOT NULL,
        "sessionToken" character varying NOT NULL,
        "expiresInSeconds" integer NOT NULL DEFAULT 900,
        "isSharing" boolean NOT NULL DEFAULT true,
        "connectedDevicesJson" text NOT NULL DEFAULT '[]',
        CONSTRAINT "PK_offline_sessions_id" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(
      `CREATE INDEX "IDX_offline_sessions_userId" ON "offline_sessions" ("userId")`,
    )

    await queryRunner.query(`
      CREATE TABLE "device_keys" (
        "id" character varying NOT NULL,
        "userId" character varying NOT NULL,
        "publicKey" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'active',
        "label" character varying NOT NULL DEFAULT '',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_device_keys_id" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(
      `CREATE INDEX "IDX_device_keys_userId" ON "device_keys" ("userId")`,
    )

    await queryRunner.query(`
      CREATE TABLE "analytics_events" (
        "id" character varying NOT NULL,
        "userId" character varying,
        "name" character varying NOT NULL,
        "properties" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "platform" character varying,
        "appVersion" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_analytics_events_id" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(
      `CREATE INDEX "IDX_analytics_events_userId" ON "analytics_events" ("userId")`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_analytics_events_name" ON "analytics_events" ("name")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "analytics_events"`)
    await queryRunner.query(`DROP TABLE "device_keys"`)
    await queryRunner.query(`DROP TABLE "offline_sessions"`)
    await queryRunner.query(`DROP TABLE "connections"`)
    await queryRunner.query(`DROP TABLE "users"`)
  }
}
