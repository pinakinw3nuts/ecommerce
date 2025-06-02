import pino from 'pino';

// Get environment variables directly to avoid circular dependency with config
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const isProduction = NODE_ENV === 'production';

/**
 * Application logger using Pino
 * Configured based on environment settings
 */
export const logger = pino({
  level: LOG_LEVEL,
  transport: !isProduction ? {
    target: 'pino-pretty',
    options: {
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    }
  } : undefined,
  base: {
    env: NODE_ENV
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
});

/**
 * Helper function to create a child logger with additional context
 * 
 * @param context - Additional context to add to the logger
 * @returns A child logger with the added context
 * 
 * @example
 * ```ts
 * // Create a logger specific to a component
 * const componentLogger = createContextLogger('PageController');
 * componentLogger.info('Page created successfully');
 * // Output: "cms-service - [PageController] Page created successfully"
 * ```
 */
export function createContextLogger(context: string) {
  return logger.child({
    context,
    // This allows for pretty formatting of context in messageFormat
    msg: `[${context}] {msg}`,
  });
}

// Log when the logger is initialized (helpful to verify it's working)
logger.debug('Logger initialized'); 