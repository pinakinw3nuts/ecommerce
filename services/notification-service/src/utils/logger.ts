import pino from 'pino';

// Determine log level based on environment
const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Create a logger instance
const logger = pino({
  level,
  transport: process.env.NODE_ENV !== 'production' 
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    : undefined,
  mixin() {
    return {
      service: 'notification-service',
      env: process.env.NODE_ENV
    };
  }
});

// For backward compatibility with existing imports
export { logger };

export default logger;

// Log levels constant
export const LOG_LEVELS = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
} as const;

// Notification context interface
export interface NotificationContext {
  notificationType?: string;
  recipient?: string;
  channel?: 'email' | 'sms' | 'push' | 'log';
  templateId?: string;
  userId?: string;
  priority?: 'high' | 'normal' | 'low';
  jobId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

// Create a notification logger with context
export const createNotificationLogger = (context: Partial<NotificationContext> = {}) => {
  const child = logger.child({
    context: {
      ...context,
      timestamp: new Date().toISOString(),
    }
  });

  return child;
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
  child: (bindings: Record<string, unknown>) => Logger;
}

// Helper method to log notification events
export const logNotificationEvent = (
  level: keyof typeof LOG_LEVELS,
  message: string,
  context: Partial<NotificationContext> = {}
) => {
  const notificationLogger = createNotificationLogger(context);
  notificationLogger[level](message);
  return notificationLogger;
};

// Simplified notification logging helpers
export const notificationSuccess = (message: string, context: Partial<NotificationContext>) => 
  logNotificationEvent('info', `Notification success: ${message}`, context);

export const notificationFailure = (message: string, context: Partial<NotificationContext>, error?: Error) => 
  logNotificationEvent('error', `Notification failure: ${message}`, {
    ...context,
    metadata: {
      ...(context.metadata || {}),
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    }
  });

export const notificationAttempt = (message: string, context: Partial<NotificationContext>) => 
  logNotificationEvent('debug', `Notification attempt: ${message}`, context);

export const notificationQueued = (message: string, context: Partial<NotificationContext>) => 
  logNotificationEvent('info', `Notification queued: ${message}`, context); 