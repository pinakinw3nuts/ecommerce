import { DataSource } from 'typeorm';
import { config } from './config';
import { ContentBlock } from './entities/ContentBlock';
import { ContentHistory } from './entities/ContentHistory';
import { ContentTranslation } from './entities/ContentTranslation';
import { ContentRevision } from './entities/ContentRevision';
import { Media } from './entities/Media';

/**
 * TypeORM Data Source for database connection
 */
export const AppDataSource = new DataSource({
  type: config.database.type as 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  synchronize: config.database.synchronize,
  logging: false,
  entities: [ContentBlock, ContentHistory, ContentTranslation, ContentRevision, Media],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.ts'],
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false
}); 