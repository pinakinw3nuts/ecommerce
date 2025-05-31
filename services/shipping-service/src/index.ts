import 'reflect-metadata';
import { startServer } from './server';

// Start the application
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 