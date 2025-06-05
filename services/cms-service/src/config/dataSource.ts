import { DataSource } from 'typeorm';
import { env } from './env';
import { ContentBlock } from '../entities/ContentBlock';
import { ContentHistory } from '../entities/ContentHistory';
import { ContentTranslation } from '../entities/ContentTranslation';
import { ContentRevision } from '../entities/ContentRevision';
import { Media } from '../entities/Media';

/**
 * TypeORM Data Source for database connection
 */
export const AppDataSource = new DataSource({
  type: env.DB_TYPE as 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  synchronize: env.DB_SYNCHRONIZE,
  logging: false,
  entities: [ContentBlock, ContentHistory, ContentTranslation, ContentRevision, Media],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.ts'],
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : false
}); 