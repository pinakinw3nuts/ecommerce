import pino from 'pino';
import { config } from '../config/env';

export const logger = pino({
  level: config.nodeEnv === 'development' ? 'debug' : 'info',
  transport: config.nodeEnv === 'development' 
    ? { target: 'pino-pretty' }
    : undefined,
  base: {
    env: config.nodeEnv,
    version: config.app.version,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});

export const createLogger = (module: string) => {
  return logger.child({ module });
}; 