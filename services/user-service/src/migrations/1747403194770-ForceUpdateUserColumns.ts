import { MigrationInterface, QueryRunner } from "typeorm";

export class ForceUpdateUserColumns1747403194770 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum types if they don't exist
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "users_role_enum" AS ENUM ('USER', 'ADMIN');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "users_status_enum" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Add or modify columns
        await queryRunner.query(`
            DO $$ 
            BEGIN
                -- Ensure users table exists
                CREATE TABLE IF NOT EXISTS "users" (
                    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );

                -- Add or modify columns
                ALTER TABLE "users" 
                    ADD COLUMN IF NOT EXISTS "email" VARCHAR,
                    ADD COLUMN IF NOT EXISTS "name" VARCHAR(255),
                    ADD COLUMN IF NOT EXISTS "phone" VARCHAR,
                    ADD COLUMN IF NOT EXISTS "role" users_role_enum,
                    ADD COLUMN IF NOT EXISTS "status" users_status_enum,
                    ADD COLUMN IF NOT EXISTS "is_email_verified" BOOLEAN DEFAULT false,
                    ADD COLUMN IF NOT EXISTS "phone_verified" BOOLEAN DEFAULT false,
                    ADD COLUMN IF NOT EXISTS "preferences" JSONB;

                -- Set default values for role and status if they are null
                UPDATE "users" 
                SET 
                    "role" = COALESCE("role", 'USER'::users_role_enum),
                    "status" = COALESCE("status", 'ACTIVE'::users_status_enum),
                    "name" = COALESCE("name", 'User ' || "id"),
                    "email" = COALESCE("email", 'temp_' || "id" || '@placeholder.com');

                -- Add NOT NULL constraints
                ALTER TABLE "users"
                    ALTER COLUMN "email" SET NOT NULL,
                    ALTER COLUMN "name" SET NOT NULL,
                    ALTER COLUMN "role" SET NOT NULL,
                    ALTER COLUMN "status" SET NOT NULL;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove constraints first
        await queryRunner.query(`
            ALTER TABLE "users"
            ALTER COLUMN "email" DROP NOT NULL,
            ALTER COLUMN "name" DROP NOT NULL,
            ALTER COLUMN "role" DROP NOT NULL,
            ALTER COLUMN "status" DROP NOT NULL;
        `);

        // Drop columns
        await queryRunner.query(`
            ALTER TABLE "users"
            DROP COLUMN IF EXISTS "preferences",
            DROP COLUMN IF EXISTS "phone_verified",
            DROP COLUMN IF EXISTS "is_email_verified",
            DROP COLUMN IF EXISTS "status",
            DROP COLUMN IF EXISTS "role",
            DROP COLUMN IF EXISTS "phone",
            DROP COLUMN IF EXISTS "name",
            DROP COLUMN IF EXISTS "email";
        `);

        // Drop enum types
        await queryRunner.query(`
            DROP TYPE IF EXISTS "users_status_enum";
            DROP TYPE IF EXISTS "users_role_enum";
        `);
    }
} 