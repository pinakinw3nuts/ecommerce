import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNameFields1684234567890 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add the columns as nullable first
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "first_name" VARCHAR,
            ADD COLUMN IF NOT EXISTS "last_name" VARCHAR
        `);

        // 2. Update existing records with default values
        await queryRunner.query(`
            UPDATE "users"
            SET 
                "first_name" = 'User',
                "last_name" = id
            WHERE "first_name" IS NULL OR "last_name" IS NULL
        `);

        // 3. Make the columns non-nullable
        await queryRunner.query(`
            ALTER TABLE "users"
            ALTER COLUMN "first_name" SET NOT NULL,
            ALTER COLUMN "last_name" SET NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            DROP COLUMN "first_name",
            DROP COLUMN "last_name"
        `);
    }
} 