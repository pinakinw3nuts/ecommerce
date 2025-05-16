import { httpLogger as logger } from './utils/logger';
import Server from './server';

async function bootstrap() {
  try {
    const server = new Server();
    await server.start();
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