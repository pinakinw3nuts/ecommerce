import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1700000000000 implements MigrationInterface {
    name = 'InitialSchema1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "name" character varying NOT NULL,
                "role" character varying NOT NULL DEFAULT 'USER',
                "status" character varying NOT NULL DEFAULT 'ACTIVE',
                "phone" character varying,
                "avatar" character varying,
                "preferences" jsonb,
                "lastLoginAt" TIMESTAMP,
                "emailVerifiedAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);

        // Create categories table
        await queryRunner.query(`
            CREATE TABLE "categories" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "slug" character varying NOT NULL,
                "description" text,
                "image" character varying,
                "parentId" uuid,
                "isActive" boolean NOT NULL DEFAULT true,
                "sortOrder" integer DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_420b9d4808c23d6c348d9f8437c" UNIQUE ("slug"),
                CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id")
            )
        `);

        // Create brands table
        await queryRunner.query(`
            CREATE TABLE "brands" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "slug" character varying NOT NULL,
                "description" text,
                "logo" character varying,
                "website" character varying,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_96db6bbbaa6f23cad26871339b6" UNIQUE ("slug"),
                CONSTRAINT "PK_b0c437120b612da39545640d82b" PRIMARY KEY ("id")
            )
        `);

        // Create products table
        await queryRunner.query(`
            CREATE TABLE "products" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "slug" character varying NOT NULL,
                "description" text,
                "shortDescription" text,
                "sku" character varying,
                "brandId" uuid,
                "categoryId" uuid,
                "price" decimal(10,2) NOT NULL,
                "comparePrice" decimal(10,2),
                "costPrice" decimal(10,2),
                "weight" decimal(8,2),
                "dimensions" jsonb,
                "isActive" boolean NOT NULL DEFAULT true,
                "isFeatured" boolean NOT NULL DEFAULT false,
                "isDigital" boolean NOT NULL DEFAULT false,
                "requiresShipping" boolean NOT NULL DEFAULT true,
                "taxRate" decimal(5,2) DEFAULT 0,
                "metaTitle" character varying,
                "metaDescription" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_464f927ae360106d78372fc7481" UNIQUE ("slug"),
                CONSTRAINT "PK_0806c755e0aca124e67c0f6b7d0" PRIMARY KEY ("id")
            )
        `);

        // Create product_variants table
        await queryRunner.query(`
            CREATE TABLE "product_variants" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "productId" uuid NOT NULL,
                "name" character varying NOT NULL,
                "sku" character varying,
                "price" decimal(10,2) NOT NULL,
                "comparePrice" decimal(10,2),
                "costPrice" decimal(10,2),
                "weight" decimal(8,2),
                "dimensions" jsonb,
                "attributes" jsonb,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_5c1d5866c32c7b0b0a0e0e0e0e0" PRIMARY KEY ("id")
            )
        `);

        // Create product_images table
        await queryRunner.query(`
            CREATE TABLE "product_images" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "productId" uuid NOT NULL,
                "variantId" uuid,
                "url" character varying NOT NULL,
                "alt" character varying,
                "isPrimary" boolean NOT NULL DEFAULT false,
                "sortOrder" integer DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_5c1d5866c32c7b0b0a0e0e0e0e1" PRIMARY KEY ("id")
            )
        `);

        // Create tags table
        await queryRunner.query(`
            CREATE TABLE "tags" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "slug" character varying NOT NULL,
                "description" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_5c1d5866c32c7b0b0a0e0e0e0e2" UNIQUE ("slug"),
                CONSTRAINT "PK_5c1d5866c32c7b0b0a0e0e0e0e3" PRIMARY KEY ("id")
            )
        `);

        // Create product_tags junction table
        await queryRunner.query(`
            CREATE TABLE "product_tags" (
                "productId" uuid NOT NULL,
                "tagId" uuid NOT NULL,
                CONSTRAINT "PK_5c1d5866c32c7b0b0a0e0e0e0e4" PRIMARY KEY ("productId", "tagId")
            )
        `);

        // Create addresses table
        await queryRunner.query(`
            CREATE TABLE "addresses" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "type" character varying NOT NULL,
                "firstName" character varying NOT NULL,
                "lastName" character varying NOT NULL,
                "company" character varying,
                "street" character varying NOT NULL,
                "street2" character varying,
                "city" character varying NOT NULL,
                "state" character varying NOT NULL,
                "country" character varying NOT NULL,
                "postalCode" character varying NOT NULL,
                "phone" character varying,
                "isDefault" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_5c1d5866c32c7b0b0a0e0e0e0e5" PRIMARY KEY ("id")
            )
        `);

        // Create carts table
        await queryRunner.query(`
            CREATE TABLE "carts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid,
                "sessionId" character varying,
                "status" character varying NOT NULL DEFAULT 'ACTIVE',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_5c1d5866c32c7b0b0a0e0e0e0e6" PRIMARY KEY ("id")
            )
        `);

        // Create cart_items table
        await queryRunner.query(`
            CREATE TABLE "cart_items" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "cartId" uuid NOT NULL,
                "productId" uuid NOT NULL,
                "variantId" uuid,
                "quantity" integer NOT NULL DEFAULT 1,
                "price" decimal(10,2) NOT NULL,
                "productSnapshot" jsonb NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_5c1d5866c32c7b0b0a0e0e0e0e7" PRIMARY KEY ("id")
            )
        `);

        // Create orders table
        await queryRunner.query(`
            CREATE TABLE "orders" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "orderNumber" character varying NOT NULL,
                "userId" uuid NOT NULL,
                "status" character varying NOT NULL DEFAULT 'PENDING',
                "total" decimal(10,2) NOT NULL,
                "subtotal" decimal(10,2) NOT NULL,
                "tax" decimal(10,2) NOT NULL DEFAULT 0,
                "shipping" decimal(10,2) NOT NULL DEFAULT 0,
                "discount" decimal(10,2) NOT NULL DEFAULT 0,
                "currency" character varying NOT NULL DEFAULT 'USD',
                "billingAddress" jsonb,
                "shippingAddress" jsonb,
                "paymentMethod" character varying,
                "paymentStatus" character varying NOT NULL DEFAULT 'PENDING',
                "shippingMethod" character varying,
                "trackingNumber" character varying,
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_5c1d5866c32c7b0b0a0e0e0e0e8" UNIQUE ("orderNumber"),
                CONSTRAINT "PK_5c1d5866c32c7b0b0a0e0e0e0e9" PRIMARY KEY ("id")
            )
        `);

        // Create order_items table
        await queryRunner.query(`
            CREATE TABLE "order_items" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "orderId" uuid NOT NULL,
                "productId" uuid NOT NULL,
                "variantId" uuid,
                "quantity" integer NOT NULL,
                "price" decimal(10,2) NOT NULL,
                "total" decimal(10,2) NOT NULL,
                "productSnapshot" jsonb NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_5c1d5866c32c7b0b0a0e0e0e0f0" PRIMARY KEY ("id")
            )
        `);

        // Create reviews table
        await queryRunner.query(`
            CREATE TABLE "reviews" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "productId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "rating" integer NOT NULL,
                "title" character varying,
                "comment" text,
                "isVerified" boolean NOT NULL DEFAULT false,
                "isApproved" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_5c1d5866c32c7b0b0a0e0e0e0f1" PRIMARY KEY ("id")
            )
        `);

        // Create notifications table
        await queryRunner.query(`
            CREATE TABLE "notifications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "type" character varying NOT NULL,
                "title" character varying NOT NULL,
                "message" text NOT NULL,
                "data" jsonb,
                "isRead" boolean NOT NULL DEFAULT false,
                "readAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_5c1d5866c32c7b0b0a0e0e0e0f2" PRIMARY KEY ("id")
            )
        `);

        // Create inventory table
        await queryRunner.query(`
            CREATE TABLE "inventory" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "productId" uuid NOT NULL,
                "variantId" uuid,
                "quantity" integer NOT NULL DEFAULT 0,
                "reservedQuantity" integer NOT NULL DEFAULT 0,
                "availableQuantity" integer NOT NULL DEFAULT 0,
                "lowStockThreshold" integer DEFAULT 10,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_5c1d5866c32c7b0b0a0e0e0e0f3" PRIMARY KEY ("id")
            )
        `);

        // Create inventory_movements table
        await queryRunner.query(`
            CREATE TABLE "inventory_movements" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "inventoryId" uuid NOT NULL,
                "type" character varying NOT NULL,
                "quantity" integer NOT NULL,
                "reference" character varying,
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_5c1d5866c32c7b0b0a0e0e0e0f4" PRIMARY KEY ("id")
            )
        `);

        // Create wishlists table
        await queryRunner.query(`
            CREATE TABLE "wishlists" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "productId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_5c1d5866c32c7b0b0a0e0e0e0f5" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for performance
        await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
        await queryRunner.query(`CREATE INDEX "IDX_products_slug" ON "products" ("slug")`);
        await queryRunner.query(`CREATE INDEX "IDX_products_category" ON "products" ("categoryId")`);
        await queryRunner.query(`CREATE INDEX "IDX_products_brand" ON "products" ("brandId")`);
        await queryRunner.query(`CREATE INDEX "IDX_orders_user" ON "orders" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_orders_status" ON "orders" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_cart_items_cart" ON "cart_items" ("cartId")`);
        await queryRunner.query(`CREATE INDEX "IDX_reviews_product" ON "reviews" ("productId")`);
        await queryRunner.query(`CREATE INDEX "IDX_inventory_product" ON "inventory" ("productId")`);
        await queryRunner.query(`CREATE INDEX "IDX_wishlists_user" ON "wishlists" ("userId")`);

        // Add foreign key constraints
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_products_brand" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE SET NULL`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_products_category" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL`);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD CONSTRAINT "FK_variants_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "product_images" ADD CONSTRAINT "FK_images_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "product_images" ADD CONSTRAINT "FK_images_variant" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "product_tags" ADD CONSTRAINT "FK_product_tags_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "product_tags" ADD CONSTRAINT "FK_product_tags_tag" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "addresses" ADD CONSTRAINT "FK_addresses_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "carts" ADD CONSTRAINT "FK_carts_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_cart_items_cart" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_cart_items_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_cart_items_variant" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_items_order" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_items_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_items_variant" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "inventory" ADD CONSTRAINT "FK_inventory_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "inventory" ADD CONSTRAINT "FK_inventory_variant" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_movements_inventory" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "wishlists" ADD CONSTRAINT "FK_wishlists_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "wishlists" ADD CONSTRAINT "FK_wishlists_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "wishlists" DROP CONSTRAINT "FK_wishlists_product"`);
        await queryRunner.query(`ALTER TABLE "wishlists" DROP CONSTRAINT "FK_wishlists_user"`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_movements_inventory"`);
        await queryRunner.query(`ALTER TABLE "inventory" DROP CONSTRAINT "FK_inventory_variant"`);
        await queryRunner.query(`ALTER TABLE "inventory" DROP CONSTRAINT "FK_inventory_product"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_user"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_product"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_variant"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_product"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_order"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_user"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_variant"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_product"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_cart"`);
        await queryRunner.query(`ALTER TABLE "carts" DROP CONSTRAINT "FK_carts_user"`);
        await queryRunner.query(`ALTER TABLE "addresses" DROP CONSTRAINT "FK_addresses_user"`);
        await queryRunner.query(`ALTER TABLE "product_tags" DROP CONSTRAINT "FK_product_tags_tag"`);
        await queryRunner.query(`ALTER TABLE "product_tags" DROP CONSTRAINT "FK_product_tags_product"`);
        await queryRunner.query(`ALTER TABLE "product_images" DROP CONSTRAINT "FK_images_variant"`);
        await queryRunner.query(`ALTER TABLE "product_images" DROP CONSTRAINT "FK_images_product"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP CONSTRAINT "FK_variants_product"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_category"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_brand"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "wishlists"`);
        await queryRunner.query(`DROP TABLE "inventory_movements"`);
        await queryRunner.query(`DROP TABLE "inventory"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TABLE "cart_items"`);
        await queryRunner.query(`DROP TABLE "carts"`);
        await queryRunner.query(`DROP TABLE "addresses"`);
        await queryRunner.query(`DROP TABLE "product_tags"`);
        await queryRunner.query(`DROP TABLE "tags"`);
        await queryRunner.query(`DROP TABLE "product_images"`);
        await queryRunner.query(`DROP TABLE "product_variants"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "brands"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
}
