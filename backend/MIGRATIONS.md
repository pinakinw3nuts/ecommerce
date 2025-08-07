# 🗄️ Database Migrations Guide

## **Overview**

This document explains how to use the database migration system for the E-commerce Backend API. Migrations ensure that database schema changes are version-controlled and can be applied consistently across different environments.

## **🚀 Quick Start**

### **Initial Setup**
```bash
# 1. Build the project
npm run build

# 2. Set up database (runs migrations + seeds)
npm run db:setup

# 3. Start the application
npm run dev
```

### **Development Workflow**
```bash
# Check migration status
npm run migrate:show

# Run pending migrations
npm run db:migrate

# Seed development data
npm run db:seed
```

## **📋 Available Commands**

### **Migration Commands**
```bash
# Run all pending migrations
npm run migrate

# Generate a new migration
npm run migrate:generate -- src/migrations/MigrationName

# Revert the last migration
npm run migrate:revert

# Show migration status
npm run migrate:show
```

### **Database Setup Commands**
```bash
# Full database setup (migrations + seeding)
npm run db:setup

# Run migrations only
npm run db:migrate

# Seed data only
npm run db:seed
```

### **Manual Seeding**
```bash
# Run seeding script directly
npm run seed
```

## **🏗️ Migration Structure**

### **Migration Files**
- **Location**: `src/migrations/`
- **Naming**: `{timestamp}-{description}.ts`
- **Example**: `1700000000000-InitialSchema.ts`

### **Migration Template**
```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationName1700000000000 implements MigrationInterface {
    name = 'MigrationName1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Migration logic here
        await queryRunner.query(`CREATE TABLE "example" (...)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback logic here
        await queryRunner.query(`DROP TABLE "example"`);
    }
}
```

## **📊 Current Migrations**

### **1. InitialSchema (1700000000000)**
**Purpose**: Creates the core e-commerce tables
**Tables Created**:
- `users` - User accounts and authentication
- `categories` - Product categories
- `brands` - Product brands
- `products` - Main product catalog
- `product_variants` - Product variations (size, color, etc.)
- `product_images` - Product images
- `tags` - Product tags
- `product_tags` - Many-to-many relationship
- `addresses` - User addresses
- `carts` - Shopping carts
- `cart_items` - Cart items
- `orders` - Customer orders
- `order_items` - Order line items
- `reviews` - Product reviews
- `notifications` - User notifications
- `inventory` - Product inventory
- `inventory_movements` - Inventory tracking
- `wishlists` - User wishlists

**Indexes Created**:
- Email indexes for performance
- Foreign key indexes
- Search optimization indexes

### **2. AdditionalEntities (1700000000001)**
**Purpose**: Creates additional business logic tables
**Tables Created**:
- `loyalty_programs` - Customer loyalty programs
- `offers` - Promotional offers
- `coupons` - Discount coupons
- `attribute_values` - Product attributes
- `product_bundles` - Product bundles
- `bundle_items` - Bundle relationships
- `shipping_providers` - Shipping carriers
- `shipping_zones` - Geographic shipping zones
- `shipping_rates` - Shipping rates
- `shipping_methods` - Shipping methods
- `shipments` - Order shipments
- `tracking` - Shipment tracking
- `payment_gateways` - Payment processors
- `payment_methods` - User payment methods
- `payments` - Payment transactions
- `refunds` - Payment refunds
- `companies` - B2B companies
- `company_profiles` - Company profiles
- `company_users` - Company user relationships
- `content_blocks` - CMS content
- `content_history` - Content change history
- `content_revisions` - Content versions
- `content_translations` - Multi-language content
- `media` - File uploads
- `currencies` - Currency management
- `customer_groups` - Customer segmentation
- `price_lists` - Dynamic pricing
- `product_prices` - Product pricing

## **🔧 Configuration**

### **Database Configuration**
```typescript
// src/config/database.ts
export const AppDataSource = new DataSource({
  // ... connection settings
  synchronize: false, // Always false for production safety
  migrations: ['src/migrations/*.ts'],
  migrationsRun: false, // Don't run migrations automatically
  migrationsTableName: 'migrations',
});
```

### **Environment Variables**
```bash
# Database connection
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=ecommerce

# Environment
NODE_ENV=development
```

## **🚨 Important Notes**

### **Production Safety**
- **`synchronize: false`** - Never use auto-sync in production
- **Manual migrations only** - All schema changes must go through migrations
- **Backup before migrations** - Always backup production database
- **Test migrations** - Test migrations in staging first

### **Development vs Production**
```typescript
// Development: Auto-seeding enabled
if (config.nodeEnv === 'development' && !pendingMigrations) {
  await seedDatabase();
}

// Production: Manual seeding only
// Run: npm run db:seed (if needed)
```

### **Migration Best Practices**
1. **Always test migrations** in development first
2. **Keep migrations small** and focused
3. **Include rollback logic** in `down()` method
4. **Use descriptive names** for migration files
5. **Never modify existing migrations** (create new ones instead)
6. **Backup before running** in production

## **🔄 Migration Workflow**

### **Adding New Features**
```bash
# 1. Create new entity
# src/entities/NewEntity.ts

# 2. Generate migration
npm run migrate:generate -- src/migrations/AddNewEntity

# 3. Review and edit migration
# src/migrations/1700000000002-AddNewEntity.ts

# 4. Test migration
npm run db:migrate

# 5. Commit changes
git add .
git commit -m "Add new entity with migration"
```

### **Deploying to Production**
```bash
# 1. Build the project
npm run build

# 2. Run migrations
npm run db:migrate

# 3. Start the application
npm start
```

## **🐛 Troubleshooting**

### **Common Issues**

#### **Migration Already Applied**
```bash
# Check migration status
npm run migrate:show

# If migration is already applied, it will be skipped
```

#### **Migration Failed**
```bash
# Check the error message
# Common causes:
# - Database connection issues
# - Syntax errors in migration
# - Foreign key constraint violations

# Revert the migration if needed
npm run migrate:revert
```

#### **Database Connection Issues**
```bash
# Check environment variables
echo $DB_HOST $DB_PORT $DB_USER $DB_NAME

# Test connection
npm run db:setup
```

### **Recovery Procedures**

#### **Reset Development Database**
```bash
# Drop and recreate database
dropdb ecommerce
createdb ecommerce

# Run full setup
npm run db:setup
```

#### **Fix Migration State**
```bash
# Check migration table
psql -d ecommerce -c "SELECT * FROM migrations;"

# Manually fix if needed
# (Be very careful in production!)
```

## **📈 Performance Considerations**

### **Migration Performance**
- **Large tables**: Consider breaking up migrations
- **Indexes**: Create indexes after data insertion
- **Foreign keys**: Add constraints after table creation
- **Batch operations**: Use batch inserts for large datasets

### **Production Migrations**
- **Downtime**: Plan for migration downtime
- **Rollback**: Always have rollback plan
- **Monitoring**: Monitor migration progress
- **Backup**: Always backup before migrations

## **🔍 Monitoring**

### **Migration Status**
```bash
# Check pending migrations
npm run migrate:show

# Check database tables
psql -d ecommerce -c "\dt"

# Check migration history
psql -d ecommerce -c "SELECT * FROM migrations ORDER BY timestamp;"
```

### **Logs**
```bash
# Application logs
npm run dev

# Database logs (PostgreSQL)
tail -f /var/log/postgresql/postgresql-*.log
```

## **📚 Additional Resources**

### **TypeORM Documentation**
- [Migrations Guide](https://typeorm.io/migrations)
- [CLI Commands](https://typeorm.io/using-cli)
- [Query Runner](https://typeorm.io/query-runner)

### **PostgreSQL Documentation**
- [CREATE TABLE](https://www.postgresql.org/docs/current/sql-createtable.html)
- [CREATE INDEX](https://www.postgresql.org/docs/current/sql-createindex.html)
- [ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)

---

**Remember**: Always test migrations thoroughly before applying them to production! 🚀
