import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import path from 'path';
import { User, Address, LoyaltyProgramEnrollment } from '../entities';

// Load environment variables
config();

// Create and export the data source
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'ecommerce',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Address, LoyaltyProgramEnrollment],
  migrations: [path.join(__dirname, '..', 'migrations', '*.{ts,js}')],
  subscribers: [],
});

// Initialize the database if it doesn't exist
async function initializeDatabase() {
  try {
    // Create a temporary connection to postgres database
    const tempDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: 'postgres', // Connect to default postgres database
    });

    await tempDataSource.initialize();

    // Check if our target database exists
    const result = await tempDataSource.query(`
      SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME || 'ecommerce'}';
    `);

    if (result.length === 0) {
      // Create the database if it doesn't exist
      await tempDataSource.query(`CREATE DATABASE "${process.env.DB_NAME || 'ecommerce'}";`);
      console.log('Database created successfully');
    }

    await tempDataSource.destroy();
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Export the initialization function
export { initializeDatabase }; 