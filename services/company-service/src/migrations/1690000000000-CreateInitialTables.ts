import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialTables1690000000000 implements MigrationInterface {
    name = 'CreateInitialTables1690000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create extension for UUID generation if it doesn't exist
        await queryRunner.query(`
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
        `);
        
        // Create companies table
        await queryRunner.query(`
            CREATE TABLE "companies" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "name" varchar NOT NULL,
                "gstNumber" varchar UNIQUE,
                "creditLimit" decimal(12,2) NOT NULL DEFAULT 0 CHECK ("creditLimit" >= 0),
                "availableCredit" integer NOT NULL DEFAULT 0,
                "country" varchar NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "phoneNumber" varchar,
                "email" varchar,
                "website" varchar,
                "billingAddress" jsonb,
                "shippingAddress" jsonb,
                "settings" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);
        
        // Create index on company name
        await queryRunner.query(`
            CREATE INDEX "IDX_companies_name" ON "companies" ("name")
        `);
        
        // Create index on GST number
        await queryRunner.query(`
            CREATE INDEX "IDX_companies_gst_number" ON "companies" ("gstNumber")
        `);
        
        // Create index on country
        await queryRunner.query(`
            CREATE INDEX "IDX_companies_country" ON "companies" ("country")
        `);
        
        // Create company_profiles table
        await queryRunner.query(`
            CREATE TABLE "company_profiles" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "companyId" uuid UNIQUE NOT NULL,
                "industry" varchar,
                "businessType" varchar,
                "yearEstablished" integer,
                "numberOfEmployees" integer,
                "description" text,
                "logoUrl" varchar,
                "socialProfiles" jsonb,
                "taxInformation" jsonb,
                "bankInformation" jsonb,
                "additionalContacts" jsonb,
                "documents" jsonb,
                "customFields" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "FK_company_profiles_company" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE
            )
        `);
        
        // Create enum type for company roles
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_role_enum') THEN
                    CREATE TYPE "company_role_enum" AS ENUM('OWNER', 'ADMIN', 'BUYER', 'FINANCE', 'APPROVER', 'VIEWER');
                END IF;
            END
            $$;
        `);
        
        // Create company_users table
        await queryRunner.query(`
            CREATE TABLE "company_users" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "companyId" uuid NOT NULL,
                "userId" varchar NOT NULL,
                "role" "company_role_enum" NOT NULL DEFAULT 'VIEWER',
                "title" varchar,
                "department" varchar,
                "permissions" jsonb,
                "isActive" boolean NOT NULL DEFAULT true,
                "invitationToken" varchar,
                "invitationExpiry" TIMESTAMP,
                "hasAcceptedInvitation" boolean NOT NULL DEFAULT false,
                "lastLoginAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "FK_company_users_company" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE,
                CONSTRAINT "UQ_company_user" UNIQUE ("companyId", "userId")
            )
        `);
        
        // Create index on company_users for company lookup
        await queryRunner.query(`
            CREATE INDEX "IDX_company_users_company" ON "company_users" ("companyId")
        `);
        
        // Create index on company_users for user lookup
        await queryRunner.query(`
            CREATE INDEX "IDX_company_users_user" ON "company_users" ("userId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order
        await queryRunner.query(`DROP TABLE IF EXISTS "company_users"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "company_role_enum"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "company_profiles"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "companies"`);
    }
} 