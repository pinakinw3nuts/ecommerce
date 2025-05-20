import 'reflect-metadata';
import { config } from './config';
import { buildApp } from './app';

const startServer = async () => {
  try {
    const app = await buildApp();
    
    await app.listen({ 
      port: config.port,
      host: '0.0.0.0'
    });

    console.info(`🚀 Order service is running on port ${config.port} in ${config.nodeEnv} mode`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer(); 