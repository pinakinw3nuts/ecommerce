import { env } from './config/env';
import { buildApp } from './app';
import { AppDataSource } from './config/dataSource';

export async function startServer(): Promise<void> {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('Database connection initialized successfully');

    // Build and start the app
    const app = await buildApp();
    
    // Start server
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`🚀 Shipping service running on port ${env.PORT}`);
    app.log.info(`📚 Swagger documentation available at http://localhost:${env.PORT}/docs`);

    // Handle graceful shutdown
    const signals = ['SIGINT', 'SIGTERM'];
    for (const signal of signals) {
      process.on(signal, async () => {
        console.log(`Received ${signal}, shutting down gracefully`);
        
        try {
          await app.close();
          console.log('HTTP server closed');
          
          await AppDataSource.destroy();
          console.log('Database connections closed');
          
          process.exit(0);
        } catch (err) {
          console.error('Error during shutdown:', err);
          process.exit(1);
        }
      });
    }
  } catch (err) {
    console.error('Error starting server:', err);
    throw err;
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
} 