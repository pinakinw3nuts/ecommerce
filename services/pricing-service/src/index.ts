// This is the main entry point for the application
// It simply imports the server module which starts the server

import './server';

// Export any interfaces or types that might be needed by external services
export * from './controllers/pricing.controller';
export * from './controllers/rate.controller';

// Log startup
console.log(`
===========================================
  Pricing Service
  Starting...
===========================================
`);

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
}); 