import pino from 'pino';
import { env } from '../config/env';

const logLevel = env.NODE_ENV === 'production' ? 'info' : 'debug';

// Create a simplified Pino logger instance
const logger = pino({
  name: 'admin-service',
  level: logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: 'admin-service',
  },
});

// Export the logger instance
export default logger; 