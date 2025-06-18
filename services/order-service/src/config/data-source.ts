import { DataSource } from 'typeorm';
import { config, DATABASE_URL } from './env';
import { OrderNote } from '../entities/OrderNote';
import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: DATABASE_URL,
  synchronize: config.isDevelopment,
  logging: false,
  entities: [Order, OrderNote, OrderItem],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],
});

export default AppDataSource; 