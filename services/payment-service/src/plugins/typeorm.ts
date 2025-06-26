import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { DataSource } from 'typeorm';
import { config } from '../config/env';
import { Payment } from '../entities/payment.entity';
import { PaymentMethod } from '../entities/payment-method.entity';
import { Refund } from '../entities/refund.entity';

// Extend FastifyInstance type to include 'db' property
import 'fastify';
declare module 'fastify' {
  interface FastifyInstance {
    db: DataSource;
  }
}

// Create TypeORM data source
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  synchronize: !config.isProduction,
  logging: false,
  entities: [Payment, PaymentMethod, Refund],
  migrations: ['src/migrations/**/*.ts']
});

// Fastify plugin to handle database connection
export const TypeormPlugin = fp(async (fastify: FastifyInstance) => {
  try {
    await AppDataSource.initialize();
    fastify.log.info('Database connection established');
    
    // Decorate Fastify instance with database connection
    fastify.decorate('db', AppDataSource);
    
    // Close database connection when Fastify closes
    fastify.addHook('onClose', async (instance) => {
      await instance.db.destroy();
      fastify.log.info('Database connection closed');
    });
  } catch (error) {
    fastify.log.error('Error connecting to database:', error);
    throw error;
  }
}); 