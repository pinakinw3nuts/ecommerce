import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/tests/**']
    }
  },
  resolve: {
    alias: {
      '@config': resolve(__dirname, './src/config'),
      '@controllers': resolve(__dirname, './src/controllers'),
      '@middlewares': resolve(__dirname, './src/middlewares'),
      '@routes': resolve(__dirname, './src/routes'),
      '@services': resolve(__dirname, './src/services'),
      '@utils': resolve(__dirname, './src/utils'),
      '@entities': resolve(__dirname, './src/entities'),
      '@types': resolve(__dirname, './src/types')
    }
  }
}); 