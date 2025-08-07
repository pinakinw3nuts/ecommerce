import { MigrationInterface, QueryRunner } from "typeorm";

export class AdditionalEntities1700000000001 implements MigrationInterface {
    name = 'AdditionalEntities1700000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create loyalty_programs table
        await queryRunner.query(`
            CREATE TABLE "loyalty_programs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" text,
                "pointsPerDollar" decimal(5,2) NOT NULL DEFAULT 1,
                "redemptionRate" decimal(5,2) NOT NULL DEFAULT 0.01,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_loyalty_programs" PRIMARY KEY ("id")
            )
        `);

        // Create offers table
        await queryRunner.query(`
            CREATE TABLE "offers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" text,
                "type" character varying NOT NULL,
                "value" decimal(10,2) NOT NULL,
                "minOrderAmount" decimal(10,2),
                "maxDiscount" decimal(10,2),
                "startDate" TIMESTAMP,
                "endDate" TIMESTAMP,
                "isActive" boolean NOT NULL DEFAULT true,
                "usageLimit" integer,
                "usedCount" integer NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_offers" PRIMARY KEY ("id")
            )
        `);

        // Create coupons table
        await queryRunner.query(`
            CREATE TABLE "coupons" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "code" character varying NOT NULL,
                "description" text,
                "type" character varying NOT NULL,
                "value" decimal(10,2) NOT NULL,
                "minOrderAmount" decimal(10,2),
                "maxDiscount" decimal(10,2),
                "startDate" TIMESTAMP,
                "endDate" TIMESTAMP,
                "isActive" boolean NOT NULL DEFAULT true,
                "usageLimit" integer,
                "usedCount" integer NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_coupons_code" UNIQUE ("code"),
                CONSTRAINT "PK_coupons" PRIMARY KEY ("id")
            )
        `);

        // Create attribute_values table
        await queryRunner.query(`
            CREATE TABLE "attribute_values" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "value" character varying NOT NULL,
                "type" character varying NOT NULL,
                "sortOrder" integer DEFAULT 0,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_attribute_values" PRIMARY KEY ("id")
            )
        `);

        // Create product_bundles table
        await queryRunner.query(`
            CREATE TABLE "product_bundles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" text,
                "discount" decimal(5,2) NOT NULL DEFAULT 0,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_product_bundles" PRIMARY KEY ("id")
            )
        `);

        // Create bundle_items junction table
        await queryRunner.query(`
            CREATE TABLE "bundle_items" (
                "bundleId" uuid NOT NULL,
                "productId" uuid NOT NULL,
                "quantity" integer NOT NULL DEFAULT 1,
                CONSTRAINT "PK_bundle_items" PRIMARY KEY ("bundleId", "productId")
            )
        `);

        // Create shipping_providers table
        await queryRunner.query(`
            CREATE TABLE "shipping_providers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "code" character varying NOT NULL,
                "description" text,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_shipping_providers_code" UNIQUE ("code"),
                CONSTRAINT "PK_shipping_providers" PRIMARY KEY ("id")
            )
        `);

        // Create shipping_zones table
        await queryRunner.query(`
            CREATE TABLE "shipping_zones" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "countries" text[] NOT NULL,
                "states" text[],
                "postalCodes" text[],
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_shipping_zones" PRIMARY KEY ("id")
            )
        `);

        // Create shipping_rates table
        await queryRunner.query(`
            CREATE TABLE "shipping_rates" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "zoneId" uuid NOT NULL,
                "providerId" uuid NOT NULL,
                "method" character varying NOT NULL,
                "rate" decimal(10,2) NOT NULL,
                "freeShippingThreshold" decimal(10,2),
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_shipping_rates" PRIMARY KEY ("id")
            )
        `);

        // Create shipping_methods table
        await queryRunner.query(`
            CREATE TABLE "shipping_methods" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "code" character varying NOT NULL,
                "description" text,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_shipping_methods_code" UNIQUE ("code"),
                CONSTRAINT "PK_shipping_methods" PRIMARY KEY ("id")
            )
        `);

        // Create shipments table
        await queryRunner.query(`
            CREATE TABLE "shipments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "orderId" uuid NOT NULL,
                "trackingNumber" character varying,
                "carrier" character varying,
                "status" character varying NOT NULL DEFAULT 'PENDING',
                "shippedAt" TIMESTAMP,
                "deliveredAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_shipments" PRIMARY KEY ("id")
            )
        `);

        // Create tracking table
        await queryRunner.query(`
            CREATE TABLE "tracking" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "shipmentId" uuid NOT NULL,
                "status" character varying NOT NULL,
                "location" character varying,
                "timestamp" TIMESTAMP NOT NULL,
                "description" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_tracking" PRIMARY KEY ("id")
            )
        `);

        // Create payment_gateways table
        await queryRunner.query(`
            CREATE TABLE "payment_gateways" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "code" character varying NOT NULL,
                "description" text,
                "isActive" boolean NOT NULL DEFAULT true,
                "config" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_payment_gateways_code" UNIQUE ("code"),
                CONSTRAINT "PK_payment_gateways" PRIMARY KEY ("id")
            )
        `);

        // Create payment_methods table
        await queryRunner.query(`
            CREATE TABLE "payment_methods" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "type" character varying NOT NULL,
                "provider" character varying NOT NULL,
                "cardLast4" character varying,
                "cardBrand" character varying,
                "expiryMonth" integer,
                "expiryYear" integer,
                "isDefault" boolean NOT NULL DEFAULT false,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_payment_methods" PRIMARY KEY ("id")
            )
        `);

        // Create payments table
        await queryRunner.query(`
            CREATE TABLE "payments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "orderId" uuid NOT NULL,
                "methodId" uuid,
                "amount" decimal(10,2) NOT NULL,
                "currency" character varying NOT NULL DEFAULT 'USD',
                "status" character varying NOT NULL DEFAULT 'PENDING',
                "gateway" character varying,
                "gatewayTransactionId" character varying,
                "gatewayResponse" jsonb,
                "processedAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_payments" PRIMARY KEY ("id")
            )
        `);

        // Create refunds table
        await queryRunner.query(`
            CREATE TABLE "refunds" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "paymentId" uuid NOT NULL,
                "amount" decimal(10,2) NOT NULL,
                "reason" text,
                "status" character varying NOT NULL DEFAULT 'PENDING',
                "gatewayRefundId" character varying,
                "processedAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_refunds" PRIMARY KEY ("id")
            )
        `);

        // Create companies table
        await queryRunner.query(`
            CREATE TABLE "companies" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "slug" character varying NOT NULL,
                "description" text,
                "logo" character varying,
                "website" character varying,
                "email" character varying,
                "phone" character varying,
                "address" jsonb,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_companies_slug" UNIQUE ("slug"),
                CONSTRAINT "PK_companies" PRIMARY KEY ("id")
            )
        `);

        // Create company_profiles table
        await queryRunner.query(`
            CREATE TABLE "company_profiles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "companyId" uuid NOT NULL,
                "type" character varying NOT NULL,
                "value" text NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_company_profiles" PRIMARY KEY ("id")
            )
        `);

        // Create company_users table
        await queryRunner.query(`
            CREATE TABLE "company_users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "companyId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "role" character varying NOT NULL,
                "permissions" jsonb,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_company_users" PRIMARY KEY ("id")
            )
        `);

        // Create content_blocks table
        await queryRunner.query(`
            CREATE TABLE "content_blocks" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying NOT NULL,
                "slug" character varying NOT NULL,
                "type" character varying NOT NULL,
                "content" text NOT NULL,
                "metadata" jsonb,
                "isPublished" boolean NOT NULL DEFAULT false,
                "publishAt" TIMESTAMP,
                "expiresAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_content_blocks_slug" UNIQUE ("slug"),
                CONSTRAINT "PK_content_blocks" PRIMARY KEY ("id")
            )
        `);

        // Create content_history table
        await queryRunner.query(`
            CREATE TABLE "content_history" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "blockId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "action" character varying NOT NULL,
                "changes" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_content_history" PRIMARY KEY ("id")
            )
        `);

        // Create content_revisions table
        await queryRunner.query(`
            CREATE TABLE "content_revisions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "blockId" uuid NOT NULL,
                "version" integer NOT NULL,
                "content" text NOT NULL,
                "metadata" jsonb,
                "createdBy" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_content_revisions" PRIMARY KEY ("id")
            )
        `);

        // Create content_translations table
        await queryRunner.query(`
            CREATE TABLE "content_translations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "blockId" uuid NOT NULL,
                "language" character varying NOT NULL,
                "title" character varying NOT NULL,
                "content" text NOT NULL,
                "isPublished" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_content_translations" PRIMARY KEY ("id")
            )
        `);

        // Create media table
        await queryRunner.query(`
            CREATE TABLE "media" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "filename" character varying NOT NULL,
                "originalName" character varying NOT NULL,
                "mimeType" character varying NOT NULL,
                "size" integer NOT NULL,
                "url" character varying NOT NULL,
                "alt" character varying,
                "metadata" jsonb,
                "uploadedBy" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_media" PRIMARY KEY ("id")
            )
        `);

        // Create currencies table
        await queryRunner.query(`
            CREATE TABLE "currencies" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "code" character varying NOT NULL,
                "name" character varying NOT NULL,
                "symbol" character varying NOT NULL,
                "exchangeRate" decimal(10,6) NOT NULL DEFAULT 1,
                "isActive" boolean NOT NULL DEFAULT true,
                "isDefault" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_currencies_code" UNIQUE ("code"),
                CONSTRAINT "PK_currencies" PRIMARY KEY ("id")
            )
        `);

        // Create customer_groups table
        await queryRunner.query(`
            CREATE TABLE "customer_groups" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" text,
                "discountRate" decimal(5,2) DEFAULT 0,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_customer_groups" PRIMARY KEY ("id")
            )
        `);

        // Create price_lists table
        await queryRunner.query(`
            CREATE TABLE "price_lists" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" text,
                "currency" character varying NOT NULL DEFAULT 'USD',
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_price_lists" PRIMARY KEY ("id")
            )
        `);

        // Create product_prices table
        await queryRunner.query(`
            CREATE TABLE "product_prices" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "productId" uuid NOT NULL,
                "priceListId" uuid NOT NULL,
                "price" decimal(10,2) NOT NULL,
                "comparePrice" decimal(10,2),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_product_prices" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for performance
        await queryRunner.query(`CREATE INDEX "IDX_coupons_code" ON "coupons" ("code")`);
        await queryRunner.query(`CREATE INDEX "IDX_payments_order" ON "payments" ("orderId")`);
        await queryRunner.query(`CREATE INDEX "IDX_payments_status" ON "payments" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_shipments_order" ON "shipments" ("orderId")`);
        await queryRunner.query(`CREATE INDEX "IDX_content_blocks_slug" ON "content_blocks" ("slug")`);
        await queryRunner.query(`CREATE INDEX "IDX_media_uploaded_by" ON "media" ("uploadedBy")`);

        // Add foreign key constraints
        await queryRunner.query(`ALTER TABLE "bundle_items" ADD CONSTRAINT "FK_bundle_items_bundle" FOREIGN KEY ("bundleId") REFERENCES "product_bundles"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "bundle_items" ADD CONSTRAINT "FK_bundle_items_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "shipping_rates" ADD CONSTRAINT "FK_shipping_rates_zone" FOREIGN KEY ("zoneId") REFERENCES "shipping_zones"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "shipping_rates" ADD CONSTRAINT "FK_shipping_rates_provider" FOREIGN KEY ("providerId") REFERENCES "shipping_providers"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "shipments" ADD CONSTRAINT "FK_shipments_order" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tracking" ADD CONSTRAINT "FK_tracking_shipment" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ADD CONSTRAINT "FK_payment_methods_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_order" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_method" FOREIGN KEY ("methodId") REFERENCES "payment_methods"("id") ON DELETE SET NULL`);
        await queryRunner.query(`ALTER TABLE "refunds" ADD CONSTRAINT "FK_refunds_payment" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "company_profiles" ADD CONSTRAINT "FK_company_profiles_company" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "company_users" ADD CONSTRAINT "FK_company_users_company" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "company_users" ADD CONSTRAINT "FK_company_users_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "content_history" ADD CONSTRAINT "FK_content_history_block" FOREIGN KEY ("blockId") REFERENCES "content_blocks"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "content_history" ADD CONSTRAINT "FK_content_history_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "content_revisions" ADD CONSTRAINT "FK_content_revisions_block" FOREIGN KEY ("blockId") REFERENCES "content_blocks"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "content_revisions" ADD CONSTRAINT "FK_content_revisions_user" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "content_translations" ADD CONSTRAINT "FK_content_translations_block" FOREIGN KEY ("blockId") REFERENCES "content_blocks"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "media" ADD CONSTRAINT "FK_media_user" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "product_prices" ADD CONSTRAINT "FK_product_prices_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "product_prices" ADD CONSTRAINT "FK_product_prices_list" FOREIGN KEY ("priceListId") REFERENCES "price_lists"("id") ON DELETE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "product_prices" DROP CONSTRAINT "FK_product_prices_list"`);
        await queryRunner.query(`ALTER TABLE "product_prices" DROP CONSTRAINT "FK_product_prices_product"`);
        await queryRunner.query(`ALTER TABLE "media" DROP CONSTRAINT "FK_media_user"`);
        await queryRunner.query(`ALTER TABLE "content_translations" DROP CONSTRAINT "FK_content_translations_block"`);
        await queryRunner.query(`ALTER TABLE "content_revisions" DROP CONSTRAINT "FK_content_revisions_user"`);
        await queryRunner.query(`ALTER TABLE "content_revisions" DROP CONSTRAINT "FK_content_revisions_block"`);
        await queryRunner.query(`ALTER TABLE "content_history" DROP CONSTRAINT "FK_content_history_user"`);
        await queryRunner.query(`ALTER TABLE "content_history" DROP CONSTRAINT "FK_content_history_block"`);
        await queryRunner.query(`ALTER TABLE "company_users" DROP CONSTRAINT "FK_company_users_user"`);
        await queryRunner.query(`ALTER TABLE "company_users" DROP CONSTRAINT "FK_company_users_company"`);
        await queryRunner.query(`ALTER TABLE "company_profiles" DROP CONSTRAINT "FK_company_profiles_company"`);
        await queryRunner.query(`ALTER TABLE "refunds" DROP CONSTRAINT "FK_refunds_payment"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_method"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_order"`);
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP CONSTRAINT "FK_payment_methods_user"`);
        await queryRunner.query(`ALTER TABLE "tracking" DROP CONSTRAINT "FK_tracking_shipment"`);
        await queryRunner.query(`ALTER TABLE "shipments" DROP CONSTRAINT "FK_shipments_order"`);
        await queryRunner.query(`ALTER TABLE "shipping_rates" DROP CONSTRAINT "FK_shipping_rates_provider"`);
        await queryRunner.query(`ALTER TABLE "shipping_rates" DROP CONSTRAINT "FK_shipping_rates_zone"`);
        await queryRunner.query(`ALTER TABLE "bundle_items" DROP CONSTRAINT "FK_bundle_items_product"`);
        await queryRunner.query(`ALTER TABLE "bundle_items" DROP CONSTRAINT "FK_bundle_items_bundle"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "product_prices"`);
        await queryRunner.query(`DROP TABLE "price_lists"`);
        await queryRunner.query(`DROP TABLE "customer_groups"`);
        await queryRunner.query(`DROP TABLE "currencies"`);
        await queryRunner.query(`DROP TABLE "media"`);
        await queryRunner.query(`DROP TABLE "content_translations"`);
        await queryRunner.query(`DROP TABLE "content_revisions"`);
        await queryRunner.query(`DROP TABLE "content_history"`);
        await queryRunner.query(`DROP TABLE "content_blocks"`);
        await queryRunner.query(`DROP TABLE "company_users"`);
        await queryRunner.query(`DROP TABLE "company_profiles"`);
        await queryRunner.query(`DROP TABLE "companies"`);
        await queryRunner.query(`DROP TABLE "refunds"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TABLE "payment_methods"`);
        await queryRunner.query(`DROP TABLE "payment_gateways"`);
        await queryRunner.query(`DROP TABLE "tracking"`);
        await queryRunner.query(`DROP TABLE "shipments"`);
        await queryRunner.query(`DROP TABLE "shipping_methods"`);
        await queryRunner.query(`DROP TABLE "shipping_rates"`);
        await queryRunner.query(`DROP TABLE "shipping_zones"`);
        await queryRunner.query(`DROP TABLE "shipping_providers"`);
        await queryRunner.query(`DROP TABLE "bundle_items"`);
        await queryRunner.query(`DROP TABLE "product_bundles"`);
        await queryRunner.query(`DROP TABLE "attribute_values"`);
        await queryRunner.query(`DROP TABLE "coupons"`);
        await queryRunner.query(`DROP TABLE "offers"`);
        await queryRunner.query(`DROP TABLE "loyalty_programs"`);
    }
}
