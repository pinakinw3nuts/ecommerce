import pino from 'pino';
import { env } from '../config/env';

const logLevel = env.NODE_ENV === 'production' ? 'info' : 'debug';

// Create a Pino logger instance with service name and timestamps
const logger = pino({
  name: 'admin-service',
  level: logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label: string) => {
      return { level: label };
    },
    // Properly serialize error objects
    log: (object: Record<string, any>) => {
      if (object.err) {
        // Handle pino error objects
        const err = object.err as Error;
        const { message, stack, ...rest } = err;
        return {
          ...object,
          err: {
            message,
            stack,
            ...rest
          }
        };
      }
      return object;
    }
  },
  base: {
    service: 'admin-service',
  },
});

// Export the logger instance
export default logger; 