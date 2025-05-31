import pino from 'pino';

interface LoggerConfig {
  isDevelopment: boolean;
}

const LOG_LEVELS = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
} as const;

export const configureLogger = ({ isDevelopment }: LoggerConfig) => {
  return pino({
    name: 'wishlist-service',
    level: isDevelopment ? 'debug' : 'info',
    customLevels: LOG_LEVELS,
    useOnlyCustomLevels: true,
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    timestamp: () => `,"timestamp":"${new Date(Date.now()).toISOString()}"`,
    base: {
      env: isDevelopment ? 'development' : 'production',
      service: 'wishlist-service',
      version: '1.0.0',
    },
    transport: isDevelopment
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
            messageFormat: '{service} - {msg}',
            levelFirst: true,
          },
        }
      : undefined,
  });
};

// Export type-safe log level methods
export type LogFn = (msg: string, ...args: any[]) => void;
export interface Logger {
  fatal: LogFn;
  error: LogFn;
  warn: LogFn;
  info: LogFn;
  debug: LogFn;
  trace: LogFn;
}

// Create the logger instance with a default configuration
// This will be updated once the actual config is loaded
export const logger = configureLogger({ isDevelopment: process.env.NODE_ENV !== 'production' }); 