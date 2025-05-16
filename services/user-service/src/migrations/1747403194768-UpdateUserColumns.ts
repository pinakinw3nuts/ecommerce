import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserColumns1747403194768 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum types if they don't exist
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "user_role_enum" AS ENUM ('USER', 'ADMIN');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "user_status_enum" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Drop old name columns if they exist
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN IF EXISTS "first_name",
            DROP COLUMN IF EXISTS "last_name"
        `);

        // Add new columns
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "name" VARCHAR(255) NOT NULL,
            ADD COLUMN IF NOT EXISTS "phone" VARCHAR(255),
            ADD COLUMN IF NOT EXISTS "role" user_role_enum NOT NULL DEFAULT 'USER',
            ADD COLUMN IF NOT EXISTS "status" user_status_enum NOT NULL DEFAULT 'ACTIVE',
            ADD COLUMN IF NOT EXISTS "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS "phone_verified" BOOLEAN NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS "preferences" JSONB
        `);

        // Update existing records with default values
        await queryRunner.query(`
            UPDATE "users"
            SET 
                "name" = COALESCE(email, 'User'),
                "role" = COALESCE("role", 'USER')::user_role_enum,
                "status" = COALESCE("status", 'ACTIVE')::user_status_enum
            WHERE "name" IS NULL OR "role" IS NULL OR "status" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove new columns
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN IF EXISTS "name",
            DROP COLUMN IF EXISTS "phone",
            DROP COLUMN IF EXISTS "role",
            DROP COLUMN IF EXISTS "status",
            DROP COLUMN IF EXISTS "is_email_verified",
            DROP COLUMN IF EXISTS "phone_verified",
            DROP COLUMN IF EXISTS "preferences"
        `);

        // Drop enum types
        await queryRunner.query(`
            DROP TYPE IF EXISTS "user_role_enum";
            DROP TYPE IF EXISTS "user_status_enum";
        `);

        // Restore old columns
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "first_name" VARCHAR(255),
            ADD COLUMN IF NOT EXISTS "last_name" VARCHAR(255)
        `);
    }

}
