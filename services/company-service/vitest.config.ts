import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/**', 'dist/**', '**/types/**', '**/*.d.ts', 'src/tests/**']
    },
    setupFiles: ['./src/tests/setup.ts'],
    testTimeout: 10000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@config': path.resolve(__dirname, './src/config'),
      '@controllers': path.resolve(__dirname, './src/controllers'),
      '@services': path.resolve(__dirname, './src/services'),
      '@entities': path.resolve(__dirname, './src/entities'),
      '@routes': path.resolve(__dirname, './src/routes'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@middlewares': path.resolve(__dirname, './src/middlewares'),
      '@constants': path.resolve(__dirname, './src/constants')
    }
  }
}); 