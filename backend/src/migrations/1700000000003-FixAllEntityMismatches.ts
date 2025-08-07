import { MigrationInterface, QueryRunner } from "typeorm";

export class FixAllEntityMismatches1700000000003 implements MigrationInterface {
    name = 'FixAllEntityMismatches1700000000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Fix brands table
        await queryRunner.query(`
            ALTER TABLE "brands" 
            ADD COLUMN IF NOT EXISTS "logoUrl" character varying,
            ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true
        `);

        // Fix addresses table
        await queryRunner.query(`
            ALTER TABLE "addresses" 
            ADD COLUMN IF NOT EXISTS "apartment" character varying,
            ADD COLUMN IF NOT EXISTS "instructions" text
        `);

        // Fix loyalty_programs table
        await queryRunner.query(`
            ALTER TABLE "loyalty_programs" 
            ADD COLUMN IF NOT EXISTS "userId" uuid,
            ADD COLUMN IF NOT EXISTS "points" integer NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "tier" character varying NOT NULL DEFAULT 'BRONZE',
            ADD COLUMN IF NOT EXISTS "benefits" jsonb,
            ADD COLUMN IF NOT EXISTS "enrolledAt" TIMESTAMP,
            ADD COLUMN IF NOT EXISTS "lastPointsEarnedAt" TIMESTAMP,
            ADD COLUMN IF NOT EXISTS "tierUpgradedAt" TIMESTAMP,
            ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true
        `);

        // Fix notifications table
        await queryRunner.query(`
            ALTER TABLE "notifications" 
            ADD COLUMN IF NOT EXISTS "to" character varying,
            ADD COLUMN IF NOT EXISTS "channel" character varying NOT NULL DEFAULT 'EMAIL',
            ADD COLUMN IF NOT EXISTS "priority" character varying NOT NULL DEFAULT 'NORMAL',
            ADD COLUMN IF NOT EXISTS "subject" character varying,
            ADD COLUMN IF NOT EXISTS "htmlContent" text,
            ADD COLUMN IF NOT EXISTS "errorLog" text,
            ADD COLUMN IF NOT EXISTS "retryCount" integer NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "nextRetryAt" TIMESTAMP,
            ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP,
            ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP,
            ADD COLUMN IF NOT EXISTS "metadata" jsonb
        `);

        // Fix inventory table
        await queryRunner.query(`
            ALTER TABLE "inventory" 
            ADD COLUMN IF NOT EXISTS "sku" character varying,
            ADD COLUMN IF NOT EXISTS "location" character varying,
            ADD COLUMN IF NOT EXISTS "threshold" integer NOT NULL DEFAULT 10,
            ADD COLUMN IF NOT EXISTS "isLowStock" boolean NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true,
            ADD COLUMN IF NOT EXISTS "metadata" jsonb,
            ADD COLUMN IF NOT EXISTS "lastRestockedAt" TIMESTAMP,
            ADD COLUMN IF NOT EXISTS "lastCountedAt" TIMESTAMP
        `);

        // Fix reviews table
        await queryRunner.query(`
            ALTER TABLE "reviews" 
            ADD COLUMN IF NOT EXISTS "isPublished" boolean NOT NULL DEFAULT true,
            ADD COLUMN IF NOT EXISTS "isVerifiedPurchase" boolean NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS "metadata" jsonb
        `);

        // Fix shipping_providers table
        await queryRunner.query(`
            ALTER TABLE "shipping_providers" 
            ADD COLUMN IF NOT EXISTS "website" character varying
        `);

        // Fix payment_gateways table
        await queryRunner.query(`
            ALTER TABLE "payment_gateways" 
            ADD COLUMN IF NOT EXISTS "type" character varying,
            ADD COLUMN IF NOT EXISTS "enabled" boolean NOT NULL DEFAULT true,
            ADD COLUMN IF NOT EXISTS "display_order" integer NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "icon_url" character varying,
            ADD COLUMN IF NOT EXISTS "redirect_url" character varying,
            ADD COLUMN IF NOT EXISTS "webhook_url" character varying,
            ADD COLUMN IF NOT EXISTS "supports_refunds" boolean NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS "supports_subscriptions" boolean NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS "supports_saved_cards" boolean NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS "min_amount" numeric(10,2),
            ADD COLUMN IF NOT EXISTS "max_amount" numeric(10,2),
            ADD COLUMN IF NOT EXISTS "transaction_fee_percent" numeric(5,2) NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "transaction_fee_fixed" numeric(10,2) NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "supported_countries" text[],
            ADD COLUMN IF NOT EXISTS "excluded_countries" text[],
            ADD COLUMN IF NOT EXISTS "supported_currencies" text[],
            ADD COLUMN IF NOT EXISTS "default_order_status" character varying NOT NULL DEFAULT 'PENDING',
            ADD COLUMN IF NOT EXISTS "payment_instructions" text,
            ADD COLUMN IF NOT EXISTS "checkout_fields" jsonb,
            ADD COLUMN IF NOT EXISTS "api_credentials" jsonb,
            ADD COLUMN IF NOT EXISTS "settings" jsonb,
            ADD COLUMN IF NOT EXISTS "metadata" jsonb,
            ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP NOT NULL DEFAULT now()
        `);

        // Fix companies table
        await queryRunner.query(`
            ALTER TABLE "companies" 
            ADD COLUMN IF NOT EXISTS "gstNumber" character varying,
            ADD COLUMN IF NOT EXISTS "creditLimit" numeric(15,2) NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "availableCredit" numeric(15,2) NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "phoneNumber" character varying,
            ADD COLUMN IF NOT EXISTS "email" character varying,
            ADD COLUMN IF NOT EXISTS "website" character varying,
            ADD COLUMN IF NOT EXISTS "billingAddress" jsonb,
            ADD COLUMN IF NOT EXISTS "shippingAddress" jsonb,
            ADD COLUMN IF NOT EXISTS "settings" jsonb
        `);

        // Fix content_block table
        await queryRunner.query(`
            ALTER TABLE "content_block" 
            ADD COLUMN IF NOT EXISTS "metaTitle" character varying,
            ADD COLUMN IF NOT EXISTS "metaDescription" text,
            ADD COLUMN IF NOT EXISTS "metaKeywords" text,
            ADD COLUMN IF NOT EXISTS "ogImage" character varying,
            ADD COLUMN IF NOT EXISTS "sortOrder" integer NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "createdBy" uuid,
            ADD COLUMN IF NOT EXISTS "updatedBy" uuid,
            ADD COLUMN IF NOT EXISTS "parentId" uuid,
            ADD COLUMN IF NOT EXISTS "locale" character varying NOT NULL DEFAULT 'en',
            ADD COLUMN IF NOT EXISTS "masterContentBlockId" uuid
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "loyalty_programs" 
            ADD CONSTRAINT "FK_loyalty_programs_user" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "content_block" 
            ADD CONSTRAINT "FK_content_block_created_by" 
            FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "content_block" 
            ADD CONSTRAINT "FK_content_block_updated_by" 
            FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "content_block" 
            ADD CONSTRAINT "FK_content_block_parent" 
            FOREIGN KEY ("parentId") REFERENCES "content_block"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "content_block" 
            ADD CONSTRAINT "FK_content_block_master" 
            FOREIGN KEY ("masterContentBlockId") REFERENCES "content_block"("id") ON DELETE SET NULL
        `);

        // Add indexes
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_brands_logo" ON "brands" ("logoUrl")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_addresses_apartment" ON "addresses" ("apartment")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_loyalty_programs_user" ON "loyalty_programs" ("userId")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_notifications_to" ON "notifications" ("to")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_inventory_sku" ON "inventory" ("sku")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_reviews_published" ON "reviews" ("isPublished")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_payment_gateways_enabled" ON "payment_gateways" ("enabled")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_companies_gst" ON "companies" ("gstNumber")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_content_block_locale" ON "content_block" ("locale")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_content_block_locale"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_companies_gst"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payment_gateways_enabled"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reviews_published"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inventory_sku"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_to"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_loyalty_programs_user"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_addresses_apartment"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_brands_logo"`);

        // Remove foreign key constraints
        await queryRunner.query(`ALTER TABLE "content_block" DROP CONSTRAINT IF EXISTS "FK_content_block_master"`);
        await queryRunner.query(`ALTER TABLE "content_block" DROP CONSTRAINT IF EXISTS "FK_content_block_parent"`);
        await queryRunner.query(`ALTER TABLE "content_block" DROP CONSTRAINT IF EXISTS "FK_content_block_updated_by"`);
        await queryRunner.query(`ALTER TABLE "content_block" DROP CONSTRAINT IF EXISTS "FK_content_block_created_by"`);
        await queryRunner.query(`ALTER TABLE "loyalty_programs" DROP CONSTRAINT IF EXISTS "FK_loyalty_programs_user"`);

        // Remove columns from content_block
        await queryRunner.query(`
            ALTER TABLE "content_block" 
            DROP COLUMN IF EXISTS "metaTitle",
            DROP COLUMN IF EXISTS "metaDescription",
            DROP COLUMN IF EXISTS "metaKeywords",
            DROP COLUMN IF EXISTS "ogImage",
            DROP COLUMN IF EXISTS "sortOrder",
            DROP COLUMN IF EXISTS "createdBy",
            DROP COLUMN IF EXISTS "updatedBy",
            DROP COLUMN IF EXISTS "parentId",
            DROP COLUMN IF EXISTS "locale",
            DROP COLUMN IF EXISTS "masterContentBlockId"
        `);

        // Remove columns from companies
        await queryRunner.query(`
            ALTER TABLE "companies" 
            DROP COLUMN IF EXISTS "gstNumber",
            DROP COLUMN IF EXISTS "creditLimit",
            DROP COLUMN IF EXISTS "availableCredit",
            DROP COLUMN IF EXISTS "phoneNumber",
            DROP COLUMN IF EXISTS "email",
            DROP COLUMN IF EXISTS "website",
            DROP COLUMN IF EXISTS "billingAddress",
            DROP COLUMN IF EXISTS "shippingAddress",
            DROP COLUMN IF EXISTS "settings"
        `);

        // Remove columns from payment_gateways
        await queryRunner.query(`
            ALTER TABLE "payment_gateways" 
            DROP COLUMN IF EXISTS "type",
            DROP COLUMN IF EXISTS "enabled",
            DROP COLUMN IF EXISTS "display_order",
            DROP COLUMN IF EXISTS "icon_url",
            DROP COLUMN IF EXISTS "redirect_url",
            DROP COLUMN IF EXISTS "webhook_url",
            DROP COLUMN IF EXISTS "supports_refunds",
            DROP COLUMN IF EXISTS "supports_subscriptions",
            DROP COLUMN IF EXISTS "supports_saved_cards",
            DROP COLUMN IF EXISTS "min_amount",
            DROP COLUMN IF EXISTS "max_amount",
            DROP COLUMN IF EXISTS "transaction_fee_percent",
            DROP COLUMN IF EXISTS "transaction_fee_fixed",
            DROP COLUMN IF EXISTS "supported_countries",
            DROP COLUMN IF EXISTS "excluded_countries",
            DROP COLUMN IF EXISTS "supported_currencies",
            DROP COLUMN IF EXISTS "default_order_status",
            DROP COLUMN IF EXISTS "payment_instructions",
            DROP COLUMN IF EXISTS "checkout_fields",
            DROP COLUMN IF EXISTS "api_credentials",
            DROP COLUMN IF EXISTS "settings",
            DROP COLUMN IF EXISTS "metadata",
            DROP COLUMN IF EXISTS "created_at",
            DROP COLUMN IF EXISTS "updated_at"
        `);

        // Remove columns from shipping_providers
        await queryRunner.query(`
            ALTER TABLE "shipping_providers" 
            DROP COLUMN IF EXISTS "website"
        `);

        // Remove columns from reviews
        await queryRunner.query(`
            ALTER TABLE "reviews" 
            DROP COLUMN IF EXISTS "isPublished",
            DROP COLUMN IF EXISTS "isVerifiedPurchase",
            DROP COLUMN IF EXISTS "metadata"
        `);

        // Remove columns from inventory
        await queryRunner.query(`
            ALTER TABLE "inventory" 
            DROP COLUMN IF EXISTS "sku",
            DROP COLUMN IF EXISTS "location",
            DROP COLUMN IF EXISTS "threshold",
            DROP COLUMN IF EXISTS "isLowStock",
            DROP COLUMN IF EXISTS "isActive",
            DROP COLUMN IF EXISTS "metadata",
            DROP COLUMN IF EXISTS "lastRestockedAt",
            DROP COLUMN IF EXISTS "lastCountedAt"
        `);

        // Remove columns from notifications
        await queryRunner.query(`
            ALTER TABLE "notifications" 
            DROP COLUMN IF EXISTS "to",
            DROP COLUMN IF EXISTS "channel",
            DROP COLUMN IF EXISTS "priority",
            DROP COLUMN IF EXISTS "subject",
            DROP COLUMN IF EXISTS "htmlContent",
            DROP COLUMN IF EXISTS "errorLog",
            DROP COLUMN IF EXISTS "retryCount",
            DROP COLUMN IF EXISTS "nextRetryAt",
            DROP COLUMN IF EXISTS "sentAt",
            DROP COLUMN IF EXISTS "scheduledAt",
            DROP COLUMN IF EXISTS "metadata"
        `);

        // Remove columns from loyalty_programs
        await queryRunner.query(`
            ALTER TABLE "loyalty_programs" 
            DROP COLUMN IF EXISTS "userId",
            DROP COLUMN IF EXISTS "points",
            DROP COLUMN IF EXISTS "tier",
            DROP COLUMN IF EXISTS "benefits",
            DROP COLUMN IF EXISTS "enrolledAt",
            DROP COLUMN IF EXISTS "lastPointsEarnedAt",
            DROP COLUMN IF EXISTS "tierUpgradedAt",
            DROP COLUMN IF EXISTS "isActive"
        `);

        // Remove columns from addresses
        await queryRunner.query(`
            ALTER TABLE "addresses" 
            DROP COLUMN IF EXISTS "apartment",
            DROP COLUMN IF EXISTS "instructions"
        `);

        // Remove columns from brands
        await queryRunner.query(`
            ALTER TABLE "brands" 
            DROP COLUMN IF EXISTS "logoUrl",
            DROP COLUMN IF EXISTS "isActive"
        `);
    }
}
