import { config as envConfig } from './env';
import { logger } from '../utils/logger';

// Re-export the environment configuration
export const config = {
  ...envConfig,
};

// Log configuration on startup (excluding sensitive values)
logger.info('Configuration loaded', {
  environment: config.isDevelopment ? 'development' : config.isProduction ? 'production' : 'test',
  port: config.port,
  corsOrigins: config.corsOrigins,
}); 