import pino from 'pino';
import { config } from '../config/env';

// Create base logger instance
const baseLogger = pino({
  name: 'api-gateway',
  level: config.server.nodeEnv === 'development' ? 'debug' : 'info',
  customLevels: {
    http: 25, // Between info (30) and debug (20)
  },
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  },
  base: {
    env: config.server.nodeEnv,
    service: 'api-gateway',
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie'],
    censor: '[REDACTED]',
  },
});

// Export main logger instance
export const httpLogger = baseLogger;

// Create child loggers for specific contexts
export const dbLogger = baseLogger.child({ context: 'database' });
export const cacheLogger = baseLogger.child({ context: 'cache' });

// Export default logger instance
export default baseLogger; 