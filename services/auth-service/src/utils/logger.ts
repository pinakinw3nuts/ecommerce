import pino from 'pino';
import { config } from '../config/env';

// Configure base logger options
const baseLogger = pino({
  level: config.isDevelopment ? 'debug' : 'info',
  timestamp: true,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  transport: config.isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

// Create a child logger with service name
const logger = baseLogger.child({
  service: 'auth-service',
  version: process.env.npm_package_version || '1.0.0',
});

// Export type for type safety when using log methods
export type Logger = typeof logger;

// Export configured logger instance
export default logger;

// Utility function to create child loggers with context
export const createChildLogger = (bindings: Record<string, unknown>) => {
  return logger.child(bindings);
}; 