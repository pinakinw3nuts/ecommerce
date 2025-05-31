import pino from 'pino';
import { env } from '../config/env';

// Configure pretty printing for development
const prettyPrint = env.NODE_ENV !== 'production';

// Create the logger instance
const logger = pino({
  name: 'company-service',
  level: env.LOG_LEVEL,
  
  // Customize timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,
  
  // Add service context to all logs
  base: {
    service: 'company-service',
    env: env.NODE_ENV
  },

  // Configure transport based on environment
  transport: prettyPrint
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  
  // Customize Pino serializers
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    // Add custom serializers for request and response objects if needed
  },
  
  // Redact sensitive information
  redact: {
    paths: [
      'password',
      'passwordHash',
      'token',
      'authorization',
      'cookie',
      '*.password',
      '*.token',
      '*.secret',
      'req.headers.authorization'
    ],
    censor: '[REDACTED]'
  }
});

/**
 * Create a child logger with additional context
 * 
 * @param context Additional context to add to logs
 * @returns Child logger instance
 */
export function createChildLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

export default logger;

// Create a child logger with request context
export function createRequestLogger(requestId: string, userId?: string) {
  return logger.child({
    requestId,
    userId: userId || 'anonymous'
  });
} 