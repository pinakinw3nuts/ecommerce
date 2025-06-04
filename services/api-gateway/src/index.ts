import { httpLogger as logger } from './utils/logger';
import Server from './server';

async function bootstrap() {
  try {
    // Check for command line arguments
    const startAllServices = process.argv.includes('--start-all-services');
    
    if (startAllServices) {
      logger.info('Starting API gateway with all microservices...');
    }
    
    const server = new Server();
    await server.start({ startAllServices });
    
    // Handle graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Received shutdown signal');
      await server.stop({ stopAllServices: startAllServices });
      process.exit(0);
    };
    
    // Register shutdown handlers
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Failed to bootstrap application',
    });
    process.exit(1);
  }
}

// Start the application
bootstrap(); 