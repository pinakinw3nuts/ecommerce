import { MigrationInterface, QueryRunner } from "typeorm";

export class FixUserEmailConstraint1747403194769 implements MigrationInterface {
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

        // Add columns if they don't exist
        await queryRunner.query(`
            DO $$ 
            BEGIN
                -- Add email column if it doesn't exist
                IF NOT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'email'
                ) THEN
                    ALTER TABLE "users" ADD COLUMN "email" VARCHAR;
                END IF;

                -- Add name column if it doesn't exist
                IF NOT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'name'
                ) THEN
                    ALTER TABLE "users" ADD COLUMN "name" VARCHAR(255);
                END IF;

                -- Add phone column if it doesn't exist
                IF NOT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'phone'
                ) THEN
                    ALTER TABLE "users" ADD COLUMN "phone" VARCHAR;
                END IF;

                -- Add role column if it doesn't exist
                IF NOT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'role'
                ) THEN
                    ALTER TABLE "users" ADD COLUMN "role" user_role_enum DEFAULT 'USER';
                END IF;

                -- Add status column if it doesn't exist
                IF NOT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'status'
                ) THEN
                    ALTER TABLE "users" ADD COLUMN "status" user_status_enum DEFAULT 'ACTIVE';
                END IF;

                -- Add is_email_verified column if it doesn't exist
                IF NOT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'is_email_verified'
                ) THEN
                    ALTER TABLE "users" ADD COLUMN "is_email_verified" BOOLEAN DEFAULT false;
                END IF;

                -- Add phone_verified column if it doesn't exist
                IF NOT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'phone_verified'
                ) THEN
                    ALTER TABLE "users" ADD COLUMN "phone_verified" BOOLEAN DEFAULT false;
                END IF;

                -- Add preferences column if it doesn't exist
                IF NOT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'preferences'
                ) THEN
                    ALTER TABLE "users" ADD COLUMN "preferences" JSONB;
                END IF;
            END $$;
        `);

        // Update any NULL emails with a temporary value
        await queryRunner.query(`
            UPDATE "users" 
            SET "email" = 'temp_' || "id" || '@placeholder.com',
                "name" = COALESCE("name", 'User ' || "id")
            WHERE "email" IS NULL OR "name" IS NULL;
        `);

        // Now we can safely add NOT NULL constraints
        await queryRunner.query(`
            ALTER TABLE "users" 
            ALTER COLUMN "email" SET NOT NULL,
            ALTER COLUMN "name" SET NOT NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the NOT NULL constraints
        await queryRunner.query(`
            ALTER TABLE "users" 
            ALTER COLUMN "email" DROP NOT NULL,
            ALTER COLUMN "name" DROP NOT NULL;
        `);

        // Drop columns in reverse order
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
            DROP TYPE IF EXISTS "user_status_enum";
            DROP TYPE IF EXISTS "user_role_enum";
        `);
    }
} 