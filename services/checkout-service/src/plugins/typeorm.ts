import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { DataSource } from 'typeorm';
import { CheckoutSession } from '../entities/CheckoutSession';

declare module 'fastify' {
  interface FastifyInstance {
    typeorm: DataSource;
  }
}

const TypeormPlugin: FastifyPluginAsync = fp(async (fastify: FastifyInstance) => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [CheckoutSession],
    synchronize: process.env.NODE_ENV === 'development', // Disable in production
    logging: process.env.NODE_ENV === 'development'
  });

  await dataSource.initialize();

  // Add to fastify instance
  fastify.decorate('typeorm', dataSource);

  // Close database connection when fastify closes
  fastify.addHook('onClose', async (instance) => {
    await instance.typeorm.destroy();
  });
});

export { TypeormPlugin }; 