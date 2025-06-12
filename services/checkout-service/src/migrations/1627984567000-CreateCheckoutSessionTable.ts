import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCheckoutSessionTable1627984567000 implements MigrationInterface {
    name = 'CreateCheckoutSessionTable1627984567000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "checkout_status_enum" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED', 'FAILED')
        `);
        
        await queryRunner.query(`
            CREATE TABLE "checkout_sessions" (
                "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                "user_id" VARCHAR NOT NULL,
                "status" "checkout_status_enum" NOT NULL DEFAULT 'PENDING',
                "cart_snapshot" JSONB NOT NULL,
                "totals" JSONB NOT NULL,
                "shipping_cost" DECIMAL(10,2) NOT NULL,
                "tax" DECIMAL(10,2) NOT NULL,
                "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
                "discount_code" VARCHAR,
                "payment_intent_id" VARCHAR,
                "shipping_method" VARCHAR NOT NULL DEFAULT 'STANDARD',
                "shipping_address" JSONB,
                "billing_address" JSONB,
                "metadata" JSONB,
                "expires_at" TIMESTAMP NOT NULL,
                "completed_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_checkout_sessions_user_id" ON "checkout_sessions" ("user_id")
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_checkout_sessions_status" ON "checkout_sessions" ("status")
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_checkout_sessions_created_at" ON "checkout_sessions" ("created_at")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_checkout_sessions_created_at"`);
        await queryRunner.query(`DROP INDEX "IDX_checkout_sessions_status"`);
        await queryRunner.query(`DROP INDEX "IDX_checkout_sessions_user_id"`);
        await queryRunner.query(`DROP TABLE "checkout_sessions"`);
        await queryRunner.query(`DROP TYPE "checkout_status_enum"`);
    }
} 