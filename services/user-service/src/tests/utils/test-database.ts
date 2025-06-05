import { DataSource } from 'typeorm'
import { User, Address, LoyaltyProgramEnrollment } from '../../entities'

export async function createTestDataSource(): Promise<DataSource> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5432'),
    username: process.env.TEST_DB_USERNAME || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'postgres',
    database: process.env.TEST_DB_DATABASE || 'user_service_test',
    entities: [User, Address, LoyaltyProgramEnrollment],
    synchronize: true, // Only for testing
    dropSchema: true, // Clean state for each test run
    logging: false // Disable query logging
  })

  await dataSource.initialize()
  return dataSource
} 