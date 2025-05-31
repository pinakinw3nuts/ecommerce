import { AppDataSource } from '../config/dataSource';
import { Client } from 'pg';
import { env } from '../config/env';

/**
 * Reset database script - drops all tables and recreates them through migrations
 */
async function resetDatabase() {
  console.log('Starting database reset...');
  
  // Connect directly to PostgreSQL to drop the database objects
  const client = new Client({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  let clientConnected = false;

  try {
    await client.connect();
    clientConnected = true;
    console.log('Connected to database');
    
    // Drop all tables and types
    console.log('Dropping all tables and types...');
    
    // Drop tables first
    await client.query('DROP TABLE IF EXISTS "company_users" CASCADE');
    await client.query('DROP TABLE IF EXISTS "company_profiles" CASCADE');
    await client.query('DROP TABLE IF EXISTS "companies" CASCADE');
    await client.query('DROP TABLE IF EXISTS "migrations" CASCADE');
    
    // Drop the enum type
    await client.query('DROP TYPE IF EXISTS "company_role_enum" CASCADE');
    
    console.log('All tables and types dropped successfully');
    
    // Close the direct connection
    await client.end();
    clientConnected = false;
    
    // Initialize TypeORM data source
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('TypeORM Data Source initialized');
    }
    
    // Run migrations
    console.log('Running migrations...');
    await AppDataSource.runMigrations();
    console.log('Migrations completed successfully');
    
    console.log('Database reset completed successfully');
  } catch (error) {
    console.error('Error during database reset:', error);
    process.exit(1);
  } finally {
    // Close connections
    if (clientConnected) {
      await client.end().catch(err => console.error('Error closing client:', err));
    }
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Run the reset function
resetDatabase()
  .then(() => {
    console.log('Database reset process finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error during database reset:', error);
    process.exit(1);
  }); 