import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTable1709558400000 implements MigrationInterface {
  name = 'CreateUserTable1709558400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for user roles
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM ('ADMIN', 'USER')
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        "name" varchar(255) NOT NULL,
        "email" varchar(255) NOT NULL UNIQUE,
        "password" varchar(255) NOT NULL,
        "role" "user_role_enum" NOT NULL DEFAULT 'USER',
        "google_id" varchar(255),
        "is_2fa_enabled" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "last_login" TIMESTAMP WITH TIME ZONE,
        "reset_token" varchar(255),
        "reset_token_expires" TIMESTAMP WITH TIME ZONE,
        "failed_login_attempts" integer NOT NULL DEFAULT 0,
        "account_locked_until" TIMESTAMP WITH TIME ZONE,
        "is_email_verified" boolean NOT NULL DEFAULT false,
        "2fa_secret" varchar(255)
      )
    `);

    // Create indices
    await queryRunner.query(`
      CREATE INDEX "idx_user_email" ON "users" ("email")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_user_google_id" ON "users" ("google_id")
      WHERE "google_id" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_user_role" ON "users" ("role")
    `);

    // Add comments for documentation
    await queryRunner.query(`
      COMMENT ON TABLE "users" IS 'User accounts for authentication and authorization';
      COMMENT ON COLUMN "users"."id" IS 'Unique identifier for the user';
      COMMENT ON COLUMN "users"."email" IS 'User email address, must be unique';
      COMMENT ON COLUMN "users"."role" IS 'User role for authorization (ADMIN or USER)';
      COMMENT ON COLUMN "users"."google_id" IS 'Google OAuth2 ID for social login';
      COMMENT ON COLUMN "users"."is_2fa_enabled" IS 'Whether two-factor authentication is enabled';
      COMMENT ON COLUMN "users"."failed_login_attempts" IS 'Count of consecutive failed login attempts';
      COMMENT ON COLUMN "users"."account_locked_until" IS 'Timestamp until which the account is locked';
      COMMENT ON COLUMN "users"."is_email_verified" IS 'Whether the email address has been verified';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indices
    await queryRunner.query(`DROP INDEX "idx_user_role"`);
    await queryRunner.query(`DROP INDEX "idx_user_google_id"`);
    await queryRunner.query(`DROP INDEX "idx_user_email"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "users"`);

    // Drop enum type
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
  }
} 