import { FastifyBaseLogger } from 'fastify';
import { pino } from 'pino';

// Extend the FastifyBaseLogger interface
declare module 'fastify' {
  interface FastifyBaseLogger {
    child(bindings: { [key: string]: any }): FastifyBaseLogger;
  }
}

// Create a Pino logger instance with our custom configuration
const createPinoLogger = (name: string) => {
  return pino({
    name,
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
  });
}

// Create our custom logger that implements the FastifyBaseLogger interface
export function createLogger(name: string): FastifyBaseLogger {
  const pinoLogger = createPinoLogger(name);

  const logger: FastifyBaseLogger = {
    info: (msg: any, ...args: any[]) => pinoLogger.info(msg, ...args),
    error: (msg: any, ...args: any[]) => pinoLogger.error(msg, ...args),
    warn: (msg: any, ...args: any[]) => pinoLogger.warn(msg, ...args),
    debug: (msg: any, ...args: any[]) => pinoLogger.debug(msg, ...args),
    trace: (msg: any, ...args: any[]) => pinoLogger.trace(msg, ...args),
    fatal: (msg: any, ...args: any[]) => {
      pinoLogger.fatal(msg, ...args);
      process.exit(1);
    },
    child: (bindings: { [key: string]: any }) => createLogger(`${name}:${bindings.name || 'child'}`),
    level: pinoLogger.level,
    silent: () => {},
  };

  return logger;
}

// Example usage:
// const moduleLogger = createLogger('module-name');
// moduleLogger.info({ event: 'action' }, 'Something happened');
// moduleLogger.error({ err }, 'An error occurred');

export type Logger = FastifyBaseLogger; 