import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { 
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_USER = 'postgres',
  DB_PASSWORD = 'admin@123',
  DB_NAME = 'ecom',
  NODE_ENV = 'development'
} = process.env;

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: DB_HOST,
  port: parseInt(DB_PORT),
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  entities: [User],
  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
  migrationsRun: false, // Temporarily disable automatic migrations
  synchronize: true, // Temporarily enable synchronization
  logging: NODE_ENV === 'development',
  ssl: NODE_ENV === 'production'
}); 