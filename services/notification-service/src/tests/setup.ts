import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.test if it exists, otherwise from .env
const envPath = path.resolve(process.cwd(), '.env.test');
config({ path: envPath });

// If .env.test doesn't exist, fall back to .env
if (!process.env.REDIS_URL) {
  config({ path: path.resolve(process.cwd(), '.env') });
}

// Set default test environment variables if not provided
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.NOTIFY_MODE = process.env.NOTIFY_MODE || 'test';

// Silence logs during tests unless explicitly enabled
if (!process.env.ENABLE_LOGS) {
  // Override console methods for tests
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;

  // Only show logs if DEBUG_TESTS is set
  if (!process.env.DEBUG_TESTS) {
    console.log = () => {};
    console.error = () => {};
    console.warn = () => {};
    console.info = () => {};
  }

  // Add a method to restore console functions if needed in specific tests
  (global as any).__restoreConsole = () => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.info = originalConsoleInfo;
  };
} 