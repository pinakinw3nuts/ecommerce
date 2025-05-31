import pino from 'pino';
import { config } from '../config';

// Create a base logger instance
const baseLogger = pino({
  level: config.logLevel,
  timestamp: true,
  formatters: {
    level: (label) => {
      return { level: label };
    }
  },
  transport: config.isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    : undefined
});

/**
 * Create a logger instance with a specific scope
 * @param scope The scope name for the logger
 */
function createScopedLogger(scope: string) {
  return baseLogger.child({ scope });
}

// Export scoped loggers for different parts of the application
export const appLogger = createScopedLogger('app');
export const dbLogger = createScopedLogger('database');
export const authLogger = createScopedLogger('auth');
export const apiLogger = createScopedLogger('api');
export const reviewLogger = createScopedLogger('review');
export const moderationLogger = createScopedLogger('moderation');

// Export the logger factory
export { createScopedLogger }; 