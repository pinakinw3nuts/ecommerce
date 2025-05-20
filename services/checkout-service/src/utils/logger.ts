import pino from 'pino';
import { config } from '../config/env';

// Configure the logger
const logger = pino({
  name: 'checkout-service',
  level: config.NODE_ENV === 'development' ? 'debug' : 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  transport: config.NODE_ENV === 'development' 
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'SYS:standard',
        },
      }
    : {
        target: 'pino/file',
        options: {}
      },
  base: {
    env: config.NODE_ENV,
    service: 'checkout-service',
  },
});

// Export default logger instance
export default logger;

// Export type for use in other files
export type Logger = typeof logger;

// Example usage:
// logger.info({ orderId: '123' }, 'Processing new order');
// logger.error({ err: error }, 'Failed to process payment');
// logger.debug({ userId: '456' }, 'User cart validated'); 