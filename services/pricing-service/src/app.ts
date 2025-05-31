import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { swaggerConfig, swaggerUiOptions } from '@config/swagger';
import { createLogger } from '@utils/logger';
import { env } from '@config/env';
import { rateService } from '@services/rate.service';
import { initializeDatabase } from '@config/dataSource';
import fastify from 'fastify';

// Import routes
import { pricingRoutes } from '@routes/pricing.routes';
import { rateRoutes } from '@routes/rate.routes';
import { healthRoutes } from '@routes/health.routes';

const logger = createLogger('app');

/**
 * Main application plugin
 */
export const app: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  try {
    // Initialize database connection
    await initializeDatabase();
    logger.info('Database connection established');

    // Register plugins
    await fastify.register(fastifyCors, {
      origin: true, // Allow all origins in development
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true
    });

    // Security headers
    await fastify.register(fastifyHelmet, {
      contentSecurityPolicy: {
        directives: {
          // Customize as needed for your application
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:']
        }
      }
    });

    // API Documentation
    if (env.NODE_ENV !== 'production') {
      await fastify.register(fastifySwagger as any, swaggerConfig);
      await fastify.register(fastifySwaggerUi, swaggerUiOptions);
      logger.info('Swagger documentation enabled');
    }

    // Global error handler
    fastify.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply) => {
      const statusCode = (error as any).statusCode || 500;
      
      // Log error details
      if (statusCode >= 500) {
        logger.error({ 
          error: error.message,
          stack: error.stack,
          url: request.url,
          method: request.method
        }, 'Server error');
      } else {
        logger.debug({ 
          error: error.message,
          url: request.url,
          method: request.method
        }, 'Client error');
      }
      
      // Send response
      reply.status(statusCode).send({
        statusCode,
        error: statusCode >= 500 ? 'Internal Server Error' : error.name,
        message: statusCode >= 500 && env.NODE_ENV === 'production' 
          ? 'An internal server error occurred'
          : error.message
      });
    });

    // Register routes
    await fastify.register(healthRoutes);
    await fastify.register(pricingRoutes, { prefix: '/api/pricing' });
    await fastify.register(rateRoutes, { prefix: '/api/rates' });

    // Initialize services
    try {
      await rateService.initialize();
    } catch (error) {
      logger.warn({ error }, 'Failed to initialize rate service, will retry on first request');
    }

    // Log registered routes in development
    if (env.NODE_ENV === 'development') {
      const routes = fastify.printRoutes();
      logger.debug(`Registered routes:\n${routes}`);
    }

    logger.info('Application initialized successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to initialize application');
    throw error;
  }
};

// Start the server if this file is run directly
if (typeof require !== 'undefined' && require.main === module) {
  const startServer = async () => {
    try {
      const server = fastify();
      await server.register(app);
      await server.listen({ port: 3011, host: '0.0.0.0' });
      // eslint-disable-next-line no-console
      console.log(`Server listening on port 3011`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error starting server:', err);
      process.exit(1);
    }
  };

  startServer();
} 