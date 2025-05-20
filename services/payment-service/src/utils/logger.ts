import pino from 'pino'
import { config } from '../config/env'

// Configure logger options based on environment
const options: pino.LoggerOptions = {
  level: config.isProduction ? 'info' : 'debug',
  formatters: {
    level: (label: string) => {
      return { level: label }
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Add service context to all logs
  base: {
    service: 'payment-service',
    env: config.isProduction ? 'production' : 'development'
  },
  // Pretty print in development
  transport: !config.isProduction
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    : {
        target: 'pino/file',
        options: { destination: 1 }
      }
}

// Create logger instance
const logger = pino(options)

// Export both default and named export
export { logger }
export default logger 