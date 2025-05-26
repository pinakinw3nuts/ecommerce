import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserTable1747986416953 implements MigrationInterface {
    name = 'CreateUserTable1747986416953'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First check if tables exist and drop them if they do
        await queryRunner.query(`
            DO $$
            BEGIN
                -- Drop tables if they exist in the correct order
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loyalty_program_enrollments') THEN
                    DROP TABLE "loyalty_program_enrollments" CASCADE;
                END IF;
                
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'addresses') THEN
                    DROP TABLE "addresses" CASCADE;
                END IF;
            END
            $$;
        `);

        // Handle users table updates
        await queryRunner.query(`
            DO $$
            BEGIN
                -- If users table exists, update it
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
                    -- Backup the role column data if it exists
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
                        ALTER TABLE "users" RENAME COLUMN "role" TO "role_old";
                    END IF;

                    -- Add the new role column
                    ALTER TABLE "users" ADD COLUMN "role" varchar(10) DEFAULT 'USER';
                    
                    -- Migrate data if old column exists
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role_old') THEN
                        UPDATE "users" SET "role" = "role_old"::text;
                        ALTER TABLE "users" DROP COLUMN "role_old";
                    END IF;

                    -- Make role column NOT NULL after data migration
                    ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;
                ELSE
                    -- Create users table if it doesn't exist
                    CREATE TABLE "users" (
                        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                        "name" character varying(255),
                        "email" character varying(255) NOT NULL,
                        "password" character varying(255) NOT NULL,
                        "role" varchar(10) NOT NULL DEFAULT 'USER',
                        "google_id" character varying(255),
                        "is_2fa_enabled" boolean NOT NULL DEFAULT false,
                        "last_login" TIMESTAMP WITH TIME ZONE,
                        "reset_token" character varying(255),
                        "reset_token_expires" TIMESTAMP WITH TIME ZONE,
                        "failed_login_attempts" integer NOT NULL DEFAULT '0',
                        "account_locked_until" TIMESTAMP WITH TIME ZONE,
                        "is_email_verified" boolean NOT NULL DEFAULT false,
                        "two_factor_secret" character varying(255),
                        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
                        CONSTRAINT "UQ_users_email" UNIQUE ("email")
                    );
                END IF;
            END
            $$;
        `);

        // Create address table if not exists
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "addresses" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "street" character varying(255) NOT NULL,
                "city" character varying(255) NOT NULL,
                "state" character varying(255) NOT NULL,
                "country" character varying(255) NOT NULL,
                "postal_code" character varying(255) NOT NULL,
                "is_default" boolean NOT NULL DEFAULT false,
                "user_id" uuid,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_addresses" PRIMARY KEY ("id")
            )
        `);

        // Create loyalty program enrollment table if not exists
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "loyalty_program_enrollments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "points" integer NOT NULL DEFAULT 0,
                "tier" character varying(255) NOT NULL DEFAULT 'BRONZE',
                "user_id" uuid,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_loyalty_enrollments" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_loyalty_user" UNIQUE ("user_id")
            )
        `);

        // Add foreign key constraints if they don't exist
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_user_address'
                ) THEN
                    ALTER TABLE "addresses" 
                    ADD CONSTRAINT "FK_user_address" 
                    FOREIGN KEY ("user_id") 
                    REFERENCES "users"("id") 
                    ON DELETE CASCADE;
                END IF;
            END
            $$;
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_user_loyalty'
                ) THEN
                    ALTER TABLE "loyalty_program_enrollments" 
                    ADD CONSTRAINT "FK_user_loyalty" 
                    FOREIGN KEY ("user_id") 
                    REFERENCES "users"("id") 
                    ON DELETE CASCADE;
                END IF;
            END
            $$;
        `);

        // Create indexes if they don't exist
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_users_email'
                ) THEN
                    CREATE INDEX "IDX_users_email" ON "users" ("email");
                END IF;
                
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_users_google_id'
                ) THEN
                    CREATE INDEX "IDX_users_google_id" ON "users" ("google_id");
                END IF;
            END
            $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order with IF EXISTS
        await queryRunner.query(`DROP TABLE IF EXISTS "loyalty_program_enrollments" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "addresses" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    }
} 