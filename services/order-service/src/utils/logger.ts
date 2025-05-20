import pino from 'pino';
import { config } from '../config/env';

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
    name: 'order-service',
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
      service: 'order-service',
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

// Create the logger instance using environment configuration
export const logger = configureLogger({ isDevelopment: config.isDevelopment }); 