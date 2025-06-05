import { DataSource } from 'typeorm';
import { config } from './env';
import { OrderNote } from '../entities/OrderNote';
import { Order } from '../entities/Order';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: config.database.url,
  synchronize: config.isDevelopment,
  logging: false,
  entities: [Order, OrderNote],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],
});

export default AppDataSource; 