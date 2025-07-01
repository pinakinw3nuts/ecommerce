import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePaymentGatewayEntity1720000000001 implements MigrationInterface {
    name = 'CreatePaymentGatewayEntity1720000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create payment gateway type enum
        await queryRunner.query(`
            CREATE TYPE "public"."payment_gateways_type_enum" AS ENUM('direct', 'redirect', 'iframe', 'offline')
        `);

        // Create payment gateways table
        await queryRunner.query(`
            CREATE TABLE "payment_gateways" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "code" character varying NOT NULL,
                "name" character varying NOT NULL,
                "description" text,
                "type" "public"."payment_gateways_type_enum" NOT NULL DEFAULT 'direct',
                "enabled" boolean NOT NULL DEFAULT true,
                "display_order" integer NOT NULL DEFAULT 0,
                "icon_url" character varying,
                "redirect_url" character varying,
                "webhook_url" character varying,
                "supports_refunds" boolean NOT NULL DEFAULT false,
                "supports_subscriptions" boolean NOT NULL DEFAULT false,
                "supports_saved_cards" boolean NOT NULL DEFAULT false,
                "min_amount" decimal(10,2),
                "max_amount" decimal(10,2),
                "transaction_fee_percent" decimal(5,2) NOT NULL DEFAULT 0,
                "transaction_fee_fixed" decimal(10,2) NOT NULL DEFAULT 0,
                "supported_countries" jsonb NOT NULL DEFAULT '[]',
                "excluded_countries" jsonb NOT NULL DEFAULT '[]',
                "supported_currencies" jsonb NOT NULL DEFAULT '[]',
                "default_order_status" character varying NOT NULL DEFAULT 'pending',
                "payment_instructions" text,
                "checkout_fields" jsonb NOT NULL DEFAULT '[]',
                "api_credentials" jsonb NOT NULL DEFAULT '{}',
                "settings" jsonb NOT NULL DEFAULT '{}',
                "metadata" jsonb NOT NULL DEFAULT '{}',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_payment_gateways" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_payment_gateways_code" UNIQUE ("code")
            )
        `);

        // Insert default payment gateways
        await queryRunner.query(`
            INSERT INTO "payment_gateways" 
                (code, name, description, type, enabled, supports_refunds, supports_saved_cards, default_order_status) 
            VALUES 
                ('stripe', 'Stripe', 'Accept payments via Stripe', 'direct', true, true, true, 'processing'),
                ('paypal', 'PayPal', 'Accept payments via PayPal', 'redirect', true, true, false, 'processing'),
                ('razorpay', 'Razorpay', 'Accept payments via Razorpay', 'direct', true, true, true, 'processing'),
                ('bank_transfer', 'Bank Transfer', 'Make payment directly to our bank account', 'offline', true, false, false, 'on-hold'),
                ('check', 'Check Payment', 'Pay via check', 'offline', true, false, false, 'on-hold'),
                ('cod', 'Cash on Delivery', 'Pay when you receive the order', 'offline', true, false, false, 'on-hold')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "payment_gateways"`);
        await queryRunner.query(`DROP TYPE "public"."payment_gateways_type_enum"`);
    }
} 