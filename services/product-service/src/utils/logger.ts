import pino, { LoggerOptions, Bindings } from 'pino';

const serviceName = 'product-service';

const logger = pino({
  name: serviceName,
  level: process.env.LOG_LEVEL || 'info',
  timestamp: true,
  formatters: {
    level(label: string) {
      return { level: label };
    },
    bindings(bindings: Bindings) {
      return { ...bindings, service: serviceName };
    },
  },
});

export default logger;
// If you see a type error for 'pino', run: pnpm add -D @types/pino 