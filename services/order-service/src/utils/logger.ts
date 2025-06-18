import pino from 'pino';
import { NODE_ENV } from '../config/env';

// Configure pretty printing for development
const prettyPrint = NODE_ENV === 'development' ? {
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      levelFirst: true,
      translateTime: 'UTC:yyyy-mm-dd HH:MM:ss.l',
    },
  },
} : undefined;

// Create logger instance
const loggerInstance = pino({
  name: 'order-service',
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  ...prettyPrint,
  // Redact sensitive information
  redact: {
    paths: ['*.password', '*.email', 'DATABASE_URL'],
    remove: true,
  },
  // Add service version
  base: {
    env: NODE_ENV,
    version: process.env.npm_package_version,
  },
});

// Export logger instance
export default loggerInstance;

// Export named logger for compatibility with existing code
export const logger = loggerInstance;

// Export type for use in other files
export type Logger = typeof loggerInstance; 