import { env } from './config/env';
import { buildApp } from './app';
import { AppDataSource } from './config/dataSource';

async function startServer(): Promise<void> {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('Database connection initialized successfully');

    // Build and start the app
    const app = await buildApp();
    
    // Start server
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`🚀 Product service running on port ${env.PORT}`);
    app.log.info(`📚 Swagger documentation available at http://localhost:${env.PORT}/docs`);

  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }

  // Graceful shutdown
  const signals = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      try {
        await AppDataSource.destroy(); // Close database connection
        process.exit(0);
      } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
      }
    });
  }
}

startServer(); 