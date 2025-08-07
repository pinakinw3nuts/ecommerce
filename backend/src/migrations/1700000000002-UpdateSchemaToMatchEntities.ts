import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSchemaToMatchEntities1700000000002 implements MigrationInterface {
    name = 'UpdateSchemaToMatchEntities1700000000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update users table to match User entity
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "googleId" character varying,
            ADD COLUMN IF NOT EXISTS "is2faEnabled" boolean NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS "isEmailVerified" boolean NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMP,
            ADD COLUMN IF NOT EXISTS "resetToken" character varying,
            ADD COLUMN IF NOT EXISTS "resetTokenExpires" TIMESTAMP,
            ADD COLUMN IF NOT EXISTS "failedLoginAttempts" integer NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "accountLockedUntil" TIMESTAMP,
            ADD COLUMN IF NOT EXISTS "twoFactorSecret" character varying,
            ADD COLUMN IF NOT EXISTS "phoneNumber" character varying
        `);

        // Update categories table to match Category entity
        await queryRunner.query(`
            ALTER TABLE "categories" 
            ADD COLUMN IF NOT EXISTS "imageUrl" character varying(500)
        `);

        // Update products table to match Product entity
        await queryRunner.query(`
            ALTER TABLE "products" 
            ADD COLUMN IF NOT EXISTS "mediaUrl" character varying,
            ADD COLUMN IF NOT EXISTS "isPublished" boolean NOT NULL DEFAULT true,
            ADD COLUMN IF NOT EXISTS "salePrice" numeric(10,2),
            ADD COLUMN IF NOT EXISTS "saleStartDate" TIMESTAMP,
            ADD COLUMN IF NOT EXISTS "saleEndDate" TIMESTAMP,
            ADD COLUMN IF NOT EXISTS "stockQuantity" integer NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "isInStock" boolean NOT NULL DEFAULT true,
            ADD COLUMN IF NOT EXISTS "specifications" text,
            ADD COLUMN IF NOT EXISTS "keywords" text,
            ADD COLUMN IF NOT EXISTS "rating" numeric(4,2) NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "reviewCount" integer NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "seoMetadata" jsonb
        `);

        // Update shipping_providers table to match ShippingProvider entity
        await queryRunner.query(`
            ALTER TABLE "shipping_providers" 
            ADD COLUMN IF NOT EXISTS "type" character varying,
            ADD COLUMN IF NOT EXISTS "status" character varying NOT NULL DEFAULT 'ACTIVE',
            ADD COLUMN IF NOT EXISTS "logoUrl" character varying,
            ADD COLUMN IF NOT EXISTS "credentials" jsonb,
            ADD COLUMN IF NOT EXISTS "settings" jsonb,
            ADD COLUMN IF NOT EXISTS "capabilities" jsonb,
            ADD COLUMN IF NOT EXISTS "baseRate" numeric(10,2) NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "handlingFee" numeric(10,2) NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "priority" integer NOT NULL DEFAULT 0
        `);

        // Update content_blocks table name to match ContentBlock entity
        await queryRunner.query(`
            ALTER TABLE "content_blocks" RENAME TO "content_block"
        `);

        // Add missing indexes
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_users_email_2fa" ON "users" ("email", "is2faEnabled")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_products_media" ON "products" ("mediaUrl")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_products_published" ON "products" ("isPublished", "isFeatured")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email_2fa"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_media"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_published"`);

        // Revert content_blocks table name
        await queryRunner.query(`
            ALTER TABLE "content_block" RENAME TO "content_blocks"
        `);

        // Remove columns from shipping_providers
        await queryRunner.query(`
            ALTER TABLE "shipping_providers" 
            DROP COLUMN IF EXISTS "type",
            DROP COLUMN IF EXISTS "status",
            DROP COLUMN IF EXISTS "logoUrl",
            DROP COLUMN IF EXISTS "credentials",
            DROP COLUMN IF EXISTS "settings",
            DROP COLUMN IF EXISTS "capabilities",
            DROP COLUMN IF EXISTS "baseRate",
            DROP COLUMN IF EXISTS "handlingFee",
            DROP COLUMN IF EXISTS "priority"
        `);

        // Remove columns from products
        await queryRunner.query(`
            ALTER TABLE "products" 
            DROP COLUMN IF EXISTS "mediaUrl",
            DROP COLUMN IF EXISTS "isPublished",
            DROP COLUMN IF EXISTS "salePrice",
            DROP COLUMN IF EXISTS "saleStartDate",
            DROP COLUMN IF EXISTS "saleEndDate",
            DROP COLUMN IF EXISTS "stockQuantity",
            DROP COLUMN IF EXISTS "isInStock",
            DROP COLUMN IF EXISTS "specifications",
            DROP COLUMN IF EXISTS "keywords",
            DROP COLUMN IF EXISTS "rating",
            DROP COLUMN IF EXISTS "reviewCount",
            DROP COLUMN IF EXISTS "seoMetadata"
        `);

        // Remove columns from categories
        await queryRunner.query(`
            ALTER TABLE "categories" 
            DROP COLUMN IF EXISTS "imageUrl"
        `);

        // Remove columns from users
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN IF EXISTS "googleId",
            DROP COLUMN IF EXISTS "is2faEnabled",
            DROP COLUMN IF EXISTS "isEmailVerified",
            DROP COLUMN IF EXISTS "lastLogin",
            DROP COLUMN IF EXISTS "resetToken",
            DROP COLUMN IF EXISTS "resetTokenExpires",
            DROP COLUMN IF EXISTS "failedLoginAttempts",
            DROP COLUMN IF EXISTS "accountLockedUntil",
            DROP COLUMN IF EXISTS "twoFactorSecret"
        `);
    }
}
