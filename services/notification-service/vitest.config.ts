import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/src/types/**']
    },
    testTimeout: 30000, // 30 seconds for queue tests
    setupFiles: ['./src/tests/setup.ts']
  }
}); 