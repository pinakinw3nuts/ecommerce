import { DataSource } from 'typeorm';
import { env } from './env';
import { Inventory } from '../entities/Inventory';
import { InventoryMovement } from '../entities/InventoryMovement';
import { Location } from '../entities/Location';

export const dataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,
  synchronize: env.NODE_ENV === 'development',
  logging: env.NODE_ENV === 'development',
  entities: [Inventory, InventoryMovement, Location],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});

// Initialize the data source
export const initializeDataSource = async () => {
  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
      console.log('Data source has been initialized');
    }
    return dataSource;
  } catch (error) {
    console.error('Error initializing data source:', error);
    throw error;
  }
}; 