#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * This script helps set up the database for the e-commerce application:
 * - Creates the database if it doesn't exist
 * - Runs migrations
 * - Seeds initial data (development only)
 * 
 * Usage:
 *   node scripts/setup-database.js
 *   node scripts/setup-database.js --migrate-only
 *   node scripts/setup-database.js --seed-only
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const migrateOnly = args.includes('--migrate-only');
const seedOnly = args.includes('--seed-only');

console.log('🗄️  DATABASE SETUP SCRIPT');
console.log('========================\n');

async function checkDatabaseConnection() {
  console.log('🔍 Checking database connection...');
  
  try {
    // Try to connect to the database
    const { AppDataSource } = require('../dist/config/database');
    await AppDataSource.initialize();
    console.log('✅ Database connection successful');
    await AppDataSource.destroy();
    return true;
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return false;
  }
}

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  try {
    // Run migrations using TypeORM CLI
    execSync('npm run migrate', { stdio: 'inherit' });
    console.log('✅ Migrations completed successfully');
    return true;
  } catch (error) {
    console.log('❌ Migration failed:', error.message);
    return false;
  }
}

async function seedDatabase() {
  console.log('🌱 Seeding database with initial data...');
  
  try {
    // Run seeding script
    execSync('npm run seed', { stdio: 'inherit' });
    console.log('✅ Database seeded successfully');
    return true;
  } catch (error) {
    console.log('❌ Seeding failed:', error.message);
    return false;
  }
}

async function checkMigrationsStatus() {
  console.log('📊 Checking migration status...');
  
  try {
    const { AppDataSource } = require('../dist/config/database');
    await AppDataSource.initialize();
    
    const pendingMigrations = await AppDataSource.showMigrations();
    const executedMigrations = await AppDataSource.showMigrations(true);
    
    console.log(`📈 Executed migrations: ${executedMigrations.length}`);
    console.log(`⏳ Pending migrations: ${pendingMigrations.length}`);
    
    await AppDataSource.destroy();
    return { pending: pendingMigrations.length, executed: executedMigrations.length };
  } catch (error) {
    console.log('❌ Could not check migration status:', error.message);
    return { pending: 0, executed: 0 };
  }
}

async function main() {
  try {
    // Check if dist folder exists (compiled TypeScript)
    if (!fs.existsSync(path.join(__dirname, '../dist'))) {
      console.log('🔨 Building TypeScript project...');
      execSync('npm run build', { stdio: 'inherit' });
    }

    if (seedOnly) {
      // Only seed the database
      await seedDatabase();
      return;
    }

    if (migrateOnly) {
      // Only run migrations
      await runMigrations();
      return;
    }

    // Full setup process
    console.log('🚀 Starting full database setup...\n');

    // Step 1: Check database connection
    const connectionOk = await checkDatabaseConnection();
    if (!connectionOk) {
      console.log('\n❌ Cannot proceed without database connection.');
      console.log('Please ensure:');
      console.log('1. PostgreSQL is running');
      console.log('2. Database credentials are correct in .env file');
      console.log('3. Database exists (create it manually if needed)');
      process.exit(1);
    }

    // Step 2: Check migration status
    const migrationStatus = await checkMigrationsStatus();
    
    if (migrationStatus.pending > 0) {
      console.log(`\n⚠️  Found ${migrationStatus.pending} pending migrations`);
      
      // Step 3: Run migrations
      const migrationSuccess = await runMigrations();
      if (!migrationSuccess) {
        console.log('\n❌ Migration failed. Please check the errors above.');
        process.exit(1);
      }
    } else {
      console.log('✅ All migrations are up to date');
    }

    // Step 4: Seed database (development only)
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined) {
      console.log('\n🌱 Development environment detected - seeding data...');
      await seedDatabase();
    } else {
      console.log('\n🚫 Skipping seeding in production environment');
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the application: npm run dev');
    console.log('2. Test the API endpoints');
    console.log('3. Check the database tables');

  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { 
  checkDatabaseConnection, 
  runMigrations, 
  seedDatabase, 
  checkMigrationsStatus 
};
