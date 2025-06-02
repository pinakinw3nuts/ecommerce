import { FastifyInstance } from 'fastify';
import { contentRoutes } from './content.routes';
import { widgetRoutes } from './widget.routes';
import { logger } from '../utils/logger';

/**
 * Register all routes with the Fastify instance
 */
export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  try {
    // Public API routes
    logger.debug('Registering public API routes');
    try {
      await fastify.register(async (publicApp) => {
        await publicApp.register(widgetRoutes, { prefix: '/widget' });
      }, { prefix: '/api/v1' });
      logger.debug('Public API routes registered successfully');
    } catch (error) {
      logger.error('Failed to register public API routes', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }

    // Protected admin routes
    logger.debug('Registering protected admin routes');
    try {
      await fastify.register(async (adminApp) => {
        // Add auth middleware to all admin routes
        adminApp.addHook('onRequest', async (request, reply) => {
          try {
            // Use the custom authenticate decorator
            await fastify.authenticate(request, reply);
          } catch (err) {
            logger.error('Authentication failed in admin routes', {
              error: err instanceof Error ? err.message : 'Unknown error',
              path: request.url
            });
            reply.status(401).send({ message: 'Unauthorized' });
          }
        });
        
        // Register protected routes
        logger.debug('Registering content routes');
        try {
          // Log the contentRoutes function
          logger.debug('Content routes type check', {
            isFunction: typeof contentRoutes === 'function',
            type: typeof contentRoutes,
            contentRoutes: JSON.stringify(contentRoutes)
          });
          
          // Try registering with a direct function call
          if (typeof contentRoutes === 'function') {
            // Register directly without using the plugin system
            await contentRoutes(adminApp);
            logger.debug('Content routes registered successfully (direct call)');
          } else {
            // Fall back to plugin registration
            await adminApp.register(contentRoutes, { prefix: '/content' });
            logger.debug('Content routes registered successfully (plugin registration)');
          }
        } catch (contentError) {
          logger.error('Failed to register content routes', {
            error: contentError instanceof Error ? contentError.message : 'Unknown error',
            stack: contentError instanceof Error ? contentError.stack : undefined,
            name: contentError instanceof Error ? contentError.name : 'Unknown error type'
          });
          throw contentError;
        }
      }, { prefix: '/api/v1/admin' });
      logger.debug('Protected admin routes registered successfully');
    } catch (error) {
      logger.error('Failed to register protected admin routes', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown error type'
      });
      throw error;
    }
  } catch (error) {
    logger.error('Failed to register routes', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown error type'
    });
    throw new Error(`Failed to register routes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Export individual route handlers for direct access if needed
export {
  contentRoutes,
  widgetRoutes
}; 