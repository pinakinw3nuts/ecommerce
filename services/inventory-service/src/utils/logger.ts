import pino from 'pino';
import { env } from '../config/env';

// Configure logger options
const loggerOptions = {
  level: env.LOG_LEVEL,
  transport: env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label: string) => {
      return { level: label };
    },
  },
  base: {
    service: 'inventory-service',
    env: env.NODE_ENV,
  },
};

// Create logger instance
export const logger = pino(loggerOptions); 