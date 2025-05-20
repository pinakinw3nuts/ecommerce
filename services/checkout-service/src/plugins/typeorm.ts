import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { DataSource } from 'typeorm';
import { CheckoutSession } from '../entities/CheckoutSession';
import { logger } from '../utils/logger';
import { config } from '../config/env';

declare module 'fastify' {
  interface FastifyInstance {
    typeorm: DataSource;
  }
}

const TypeormPlugin: FastifyPluginAsync = fp(async (fastify: FastifyInstance) => {
  try {
    logger.info('Initializing database connection...');
    logger.debug('Database configuration:', {
      url: config.database.url.replace(/:[^:@]+@/, ':***@'), // Hide password
      entities: [CheckoutSession],
      synchronize: config.isDevelopment
    });

    const dataSource = new DataSource({
      type: 'postgres',
      url: config.database.url,
      entities: [CheckoutSession],
      synchronize: config.isDevelopment, // Disable in production
      logging: config.isDevelopment
    });

    await dataSource.initialize();
    logger.info('Database connection established successfully');

    // Add to fastify instance
    fastify.decorate('typeorm', dataSource);

    // Close database connection when fastify closes
    fastify.addHook('onClose', async (instance) => {
      logger.info('Closing database connection...');
      try {
        await instance.typeorm.destroy();
        logger.info('Database connection closed successfully');
      } catch (err) {
        logger.error('Error closing database connection:', err);
        throw err;
      }
    });
  } catch (err) {
    logger.error('Failed to initialize database:', {
      error: err instanceof Error ? err.message : err,
      stack: err instanceof Error ? err.stack : undefined,
      details: err
    });
    throw err;
  }
});

export { TypeormPlugin }; 