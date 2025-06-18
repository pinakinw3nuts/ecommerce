import pino from 'pino';
import { env } from '../config/env';

// Configure the logger
export const logger = pino({
  level: env?.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});

// Export a default instance for direct import
export default logger; 