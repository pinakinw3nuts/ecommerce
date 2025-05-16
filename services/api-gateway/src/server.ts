import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { config } from './config/env';
import { configureRateLimiter } from './middlewares/rateLimiter';
import { configureRequestLogger } from './middlewares/requestLogger';
import healthRoutes from './routes/health.routes';
import proxyRoutes from './routes/proxy.routes';
import rootRoutes from './routes/root.routes';
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
      });

      // Rate limiting
      await configureRateLimiter(this.server);

      // Request logging
      await configureRequestLogger(this.server);

      // Register routes
      await this.server.register(rootRoutes);
      await this.server.register(healthRoutes);
      await this.server.register(proxyRoutes);

      logger.info('Server configured successfully');
    } catch (error) {
      logger.error({ err: error }, 'Failed to configure server');
      throw error;
    }
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
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
   */
  public async stop(): Promise<void> {
    try {
      await this.server.close();
      logger.info('Server stopped successfully');
    } catch (error) {
      logger.error({ err: error }, 'Failed to stop server');
      throw error;
    }
  }
}

export default Server; 