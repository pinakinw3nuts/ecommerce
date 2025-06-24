import pino from 'pino';
import { config } from '../config/env';

// Create logger instance
const logger = pino({
  name: 'order-service',
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: config.isDevelopment ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      levelFirst: true,
      translateTime: 'UTC:yyyy-mm-dd HH:MM:ss.l',
    },
  } : undefined,
  // Redact sensitive information
  redact: {
    paths: ['*.password', '*.email', 'DATABASE_URL'],
    remove: true,
  },
  // Add service version
  base: {
    env: config.nodeEnv,
    version: process.env.npm_package_version,
  },
});

export { logger };
export type Logger = typeof logger; 