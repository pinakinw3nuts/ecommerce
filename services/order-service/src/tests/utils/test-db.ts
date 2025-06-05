import { DataSource } from 'typeorm';
import { config } from '../../config';
import { Order } from '../../entities/order.entity';
import { OrderNote } from '../../entities/order-note.entity';

let testDataSource: DataSource;

export async function createTestDatabase() {
  testDataSource = new DataSource({
    type: 'postgres',
    host: config.database.host,
    port: config.database.port,
    username: config.database.username,
    password: config.database.password,
    database: config.database.name + '_test',
    entities: [Order, OrderNote],
    synchronize: true,
    dropSchema: true,
    logging: false
  });

  await testDataSource.initialize();
  await testDataSource.synchronize(true); // Force schema recreation
}

export async function cleanupTestDatabase() {
  if (testDataSource && testDataSource.isInitialized) {
    await testDataSource.dropDatabase();
    await testDataSource.destroy();
  }
}

export function getTestDataSource() {
  return testDataSource;
} 