import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import { config } from './config/env';
import { configureRateLimiter } from './middlewares/rateLimiter';
import { configureRequestLogger } from './middlewares/requestLogger';
import healthRoutes from './routes/health.routes';
import proxyRoutes from './routes/proxy.routes';
import rootRoutes from './routes/root.routes';
import authRoutes from './routes/auth';
import userRoutes from './routes/user.routes';
import ecommerceRoutes from './routes/ecommerce.routes';
import { httpLogger as logger } from './utils/logger';

export class Server {
  private server;

  constructor() {
    this.server = fastify({
      logger: logger as any, // Type assertion needed due to logger compatibility
      disableRequestLogging: true, // We'll handle request logging ourselves
      trustProxy: true, // Trust X-Forwarded-* headers
    });
  }

  /**
   * Configure server plugins and middleware
   */
  private async configureServer(): Promise<void> {
    try {
      // Security headers
      await this.server.register(helmet);

      // CORS
      await this.server.register(cors, {
        origin: config.server.cors.origin,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
        exposedHeaders: ['Set-Cookie'],
        maxAge: 86400
      });

      // Cookie plugin
      await this.server.register(cookie, {
        secret: config.server.cookieSecret || 'your-secret-key',
        hook: 'onRequest',
        parseOptions: {
          httpOnly: true,
          secure: config.server.nodeEnv === 'production',
          sameSite: config.server.nodeEnv === 'production' ? 'strict' : 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 // 7 days
        }
      });

      // Rate limiting
      await configureRateLimiter(this.server);

      // Request logging
      await configureRequestLogger(this.server);

      // Register routes
      await this.server.register(rootRoutes);
      await this.server.register(healthRoutes);
      await this.server.register(userRoutes, { prefix: '/api' });
      await this.server.register(authRoutes, { prefix: '/api/auth' });
      await this.server.register(ecommerceRoutes, { prefix: '/api' });
      await this.server.register(proxyRoutes);

      logger.info('Server configured successfully');
    } catch (error) {
      logger.error({ err: error }, 'Failed to configure server');
      throw error;
    }
  }

  /**
   * Start the server
   * @param options Options for starting the server
   */
  public async start(options: { startAllServices?: boolean } = {}): Promise<void> {
    try {
      // Start dependent services if requested
      if (options.startAllServices) {
        try {
          logger.info('Starting all microservices...');
          // Use absolute path for import
          const scriptsPath = require.resolve('../../scripts/start-services');
          const { startAllServices } = await import(scriptsPath);
          await startAllServices();
          logger.info('All microservices started successfully');
        } catch (error) {
          logger.error({ err: error }, 'Failed to start microservices');
          // Continue starting the API gateway even if services fail
        }
      }

      await this.configureServer();

      const address = await this.server.listen({
        port: config.server.port,
        host: '0.0.0.0',
      });

      logger.info({
        msg: 'Server started successfully',
        url: address,
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to start server');
      throw error;
    }
  }

  /**
   * Stop the server
   * @param options Options for stopping the server
   */
  public async stop(options: { stopAllServices?: boolean } = {}): Promise<void> {
    try {
      await this.server.close();
      logger.info('Server stopped successfully');

      // Stop dependent services if requested
      if (options.stopAllServices) {
        try {
          logger.info('Stopping all microservices...');
          // Use absolute path for import
          const scriptsPath = require.resolve('../../scripts/start-services');
          const { stopAllServices } = await import(scriptsPath);
          stopAllServices();
          logger.info('All microservices stopped successfully');
        } catch (error) {
          logger.error({ err: error }, 'Failed to stop microservices');
        }
      }
    } catch (error) {
      logger.error({ err: error }, 'Failed to stop server');
      throw error;
    }
  }
}

export default Server; 