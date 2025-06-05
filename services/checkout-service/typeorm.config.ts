import { DataSource } from 'typeorm';
import { CheckoutSession } from './src/entities/CheckoutSession';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const dataSource = new DataSource({
  type: 'postgres' as const,
  url: process.env.DATABASE_URL,
  entities: [CheckoutSession],
  migrations: ['src/migrations/*.ts'],
  migrationsRun: false,
  synchronize: false,
  logging: false,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default dataSource; 