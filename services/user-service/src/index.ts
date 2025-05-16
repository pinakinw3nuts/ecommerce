import { createServer } from './server';
import { DataSource } from 'typeorm';
import { User, Address, LoyaltyProgramEnrollment } from './entities';
import logger from './utils/logger';
import { NODE_ENV } from './config/env';
import path from 'path';

const start = async () => {
  try {
    const dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, Address, LoyaltyProgramEnrollment],
      migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
      migrationsRun: true,
      synchronize: false,
      logging: NODE_ENV === 'development',
      ssl: NODE_ENV === 'production'
    });

    await dataSource.initialize();
    logger.info('Database connection established');

    const server = await createServer({ dataSource });
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    const address = await server.listen({ port, host: '0.0.0.0' });
    logger.info(`Server listening at ${address}`);
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
};

start(); 