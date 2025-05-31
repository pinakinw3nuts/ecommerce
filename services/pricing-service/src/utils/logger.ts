import pino from 'pino';
import { env } from '../config/env';

// Define log levels
type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

// Configure base logger
const baseLogger = pino({
  level: env.LOG_LEVEL || 'info',
  transport: env.NODE_ENV === 'development' 
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      } 
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    }
  },
  base: {
    service: 'pricing-service',
    env: env.NODE_ENV
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

/**
 * Creates a logger instance with the given module name
 * 
 * @param module The name of the module using the logger
 * @returns A logger instance with the module name included in all logs
 */
export function createLogger(module: string) {
  return baseLogger.child({ module });
}

/**
 * Get the current log level
 */
export function getLogLevel(): LogLevel {
  return baseLogger.level as LogLevel;
}

/**
 * Set the log level
 * 
 * @param level The log level to set
 */
export function setLogLevel(level: LogLevel): void {
  baseLogger.level = level;
}

// Export default logger for convenience
export default baseLogger; 