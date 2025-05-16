import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAddressAndLoyaltyTables1747403194771 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create address type enum
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "address_type_enum" AS ENUM ('HOME', 'WORK', 'BILLING', 'SHIPPING', 'OTHER');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create loyalty tier enum
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "loyalty_tier_enum" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create addresses table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "addresses" (
                "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "street" VARCHAR(255) NOT NULL,
                "apartment" VARCHAR(255),
                "city" VARCHAR(255) NOT NULL,
                "state" VARCHAR(255) NOT NULL,
                "country" VARCHAR(255) NOT NULL,
                "postal_code" VARCHAR(255) NOT NULL,
                "type" address_type_enum NOT NULL DEFAULT 'HOME',
                "isDefault" BOOLEAN NOT NULL DEFAULT false,
                "phone" VARCHAR(255),
                "instructions" TEXT,
                "user_id" UUID NOT NULL,
                CONSTRAINT "fk_user_addresses" FOREIGN KEY ("user_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE
            );
        `);

        // Create loyalty program enrollments table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "loyalty_program_enrollments" (
                "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "points" INTEGER NOT NULL DEFAULT 0,
                "tier" loyalty_tier_enum NOT NULL DEFAULT 'BRONZE',
                "enrolled_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "last_points_earned_at" TIMESTAMP WITH TIME ZONE,
                "tier_upgraded_at" TIMESTAMP WITH TIME ZONE,
                "benefits" JSONB NOT NULL DEFAULT '{"freeShipping": false, "birthdayBonus": false, "exclusiveOffers": false, "prioritySupport": false}'::jsonb,
                "isActive" BOOLEAN NOT NULL DEFAULT true,
                "user_id" UUID NOT NULL UNIQUE,
                CONSTRAINT "fk_user_loyalty" FOREIGN KEY ("user_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE
            );
        `);

        // Create indexes
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_addresses_user_id" ON "addresses"("user_id");
            CREATE INDEX IF NOT EXISTS "idx_addresses_type" ON "addresses"("type");
            CREATE INDEX IF NOT EXISTS "idx_loyalty_user_id" ON "loyalty_program_enrollments"("user_id");
            CREATE INDEX IF NOT EXISTS "idx_loyalty_tier" ON "loyalty_program_enrollments"("tier");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables
        await queryRunner.query(`
            DROP TABLE IF EXISTS "loyalty_program_enrollments";
            DROP TABLE IF EXISTS "addresses";
        `);

        // Drop enums
        await queryRunner.query(`
            DROP TYPE IF EXISTS "loyalty_tier_enum";
            DROP TYPE IF EXISTS "address_type_enum";
        `);
    }
} 