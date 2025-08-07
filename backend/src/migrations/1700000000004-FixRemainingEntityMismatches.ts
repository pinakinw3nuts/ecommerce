import { MigrationInterface, QueryRunner } from "typeorm";

export class FixRemainingEntityMismatches1700000000004 implements MigrationInterface {
    name = 'FixRemainingEntityMismatches1700000000004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Fix loyalty_programs table - add missing name column
        await queryRunner.query(`
            ALTER TABLE "loyalty_programs" 
            ADD COLUMN IF NOT EXISTS "name" character varying NOT NULL DEFAULT 'Default Loyalty Program'
        `);

        // Fix notifications table - add missing status column
        await queryRunner.query(`
            ALTER TABLE "notifications" 
            ADD COLUMN IF NOT EXISTS "status" character varying NOT NULL DEFAULT 'PENDING'
        `);

        // Fix inventory table - add missing stock column
        await queryRunner.query(`
            ALTER TABLE "inventory" 
            ADD COLUMN IF NOT EXISTS "stock" integer NOT NULL DEFAULT 0
        `);

        // Fix shipping_providers table - add missing code column
        await queryRunner.query(`
            ALTER TABLE "shipping_providers" 
            ADD COLUMN IF NOT EXISTS "code" character varying NOT NULL DEFAULT 'default'
        `);

        // Fix companies table - add missing country column
        await queryRunner.query(`
            ALTER TABLE "companies" 
            ADD COLUMN IF NOT EXISTS "country" character varying
        `);

        // Fix currencies table - add missing columns
        await queryRunner.query(`
            ALTER TABLE "currencies" 
            ADD COLUMN IF NOT EXISTS "decimalPlaces" integer NOT NULL DEFAULT 2,
            ADD COLUMN IF NOT EXISTS "format" character varying NOT NULL DEFAULT '{symbol}{amount}',
            ADD COLUMN IF NOT EXISTS "rateLastUpdated" TIMESTAMP
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove columns from currencies
        await queryRunner.query(`
            ALTER TABLE "currencies" 
            DROP COLUMN IF EXISTS "decimalPlaces",
            DROP COLUMN IF EXISTS "format",
            DROP COLUMN IF EXISTS "rateLastUpdated"
        `);

        // Remove columns from companies
        await queryRunner.query(`
            ALTER TABLE "companies" 
            DROP COLUMN IF EXISTS "country"
        `);

        // Remove columns from shipping_providers
        await queryRunner.query(`
            ALTER TABLE "shipping_providers" 
            DROP COLUMN IF EXISTS "code"
        `);

        // Remove columns from inventory
        await queryRunner.query(`
            ALTER TABLE "inventory" 
            DROP COLUMN IF EXISTS "stock"
        `);

        // Remove columns from notifications
        await queryRunner.query(`
            ALTER TABLE "notifications" 
            DROP COLUMN IF EXISTS "status"
        `);

        // Remove columns from loyalty_programs
        await queryRunner.query(`
            ALTER TABLE "loyalty_programs" 
            DROP COLUMN IF EXISTS "name"
        `);
    }
}
