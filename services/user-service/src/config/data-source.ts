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