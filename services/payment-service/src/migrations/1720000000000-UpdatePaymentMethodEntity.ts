import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePaymentMethodEntity1720000000000 implements MigrationInterface {
    name = 'UpdatePaymentMethodEntity1720000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new payment method types to the enum
        await queryRunner.query(`
            ALTER TYPE "public"."payment_methods_type_enum" 
            ADD VALUE IF NOT EXISTS 'digital_wallet' 
            ADD VALUE IF NOT EXISTS 'bank_transfer' 
            ADD VALUE IF NOT EXISTS 'check' 
            ADD VALUE IF NOT EXISTS 'cash_on_delivery' 
            ADD VALUE IF NOT EXISTS 'subscription' 
            ADD VALUE IF NOT EXISTS 'invoice' 
            ADD VALUE IF NOT EXISTS 'buy_now_pay_later' 
            ADD VALUE IF NOT EXISTS 'cryptocurrency'
        `);

        // Add new payment method statuses to the enum
        await queryRunner.query(`
            ALTER TYPE "public"."payment_methods_status_enum" 
            ADD VALUE IF NOT EXISTS 'pending' 
            ADD VALUE IF NOT EXISTS 'expired' 
            ADD VALUE IF NOT EXISTS 'declined'
        `);

        // Create new payment method category enum
        await queryRunner.query(`
            CREATE TYPE "public"."payment_methods_category_enum" AS ENUM('online', 'offline', 'manual')
        `);

        // Make existing columns nullable
        await queryRunner.query(`ALTER TABLE "payment_methods" ALTER COLUMN "expiry_month" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ALTER COLUMN "expiry_year" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ALTER COLUMN "brand" DROP NOT NULL`);

        // Add new columns
        await queryRunner.query(`ALTER TABLE "payment_methods" ADD "category" "public"."payment_methods_category_enum" NOT NULL DEFAULT 'online'`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ADD "requires_manual_verification" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ADD "processing_time" character varying`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ADD "payment_instructions" text`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ADD "icon_url" character varying`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ADD "supported_currencies" jsonb`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ADD "transaction_fee_percent" decimal(5,2)`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ADD "transaction_fee_fixed" decimal(10,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop new columns
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP COLUMN "transaction_fee_fixed"`);
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP COLUMN "transaction_fee_percent"`);
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP COLUMN "supported_currencies"`);
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP COLUMN "icon_url"`);
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP COLUMN "payment_instructions"`);
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP COLUMN "processing_time"`);
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP COLUMN "requires_manual_verification"`);
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP COLUMN "category"`);

        // Make columns non-nullable again
        await queryRunner.query(`ALTER TABLE "payment_methods" ALTER COLUMN "brand" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ALTER COLUMN "expiry_year" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ALTER COLUMN "expiry_month" SET NOT NULL`);

        // Drop the new enum
        await queryRunner.query(`DROP TYPE "public"."payment_methods_category_enum"`);

        // Note: We can't easily remove values from enums in PostgreSQL, so we leave the added enum values
    }
} 