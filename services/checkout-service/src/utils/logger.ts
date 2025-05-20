import pino from 'pino';

// Create a logger factory function that accepts configuration
export function createLogger(config: { isDevelopment: boolean }) {
  return pino({
    level: config.isDevelopment ? 'debug' : 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'SYS:standard'
      }
    }
  });
}

// Create a default logger with basic configuration
// This will be replaced with properly configured logger after env loads
const defaultLogger = createLogger({ isDevelopment: process.env.NODE_ENV === 'development' });

// Export the logger instance
export let logger = defaultLogger;

// Function to reconfigure the logger
export function configureLogger(config: { isDevelopment: boolean }) {
  logger = createLogger(config);
  return logger;
}

// Export type for use in other files
export type Logger = typeof logger;

// Example usage:
// logger.info({ orderId: '123' }, 'Processing new order');
// logger.error({ err: error }, 'Failed to process payment');
// logger.debug({ userId: '456' }, 'User cart validated'); 