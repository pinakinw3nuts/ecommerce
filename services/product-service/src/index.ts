import 'reflect-metadata';
import { buildApp } from './app';
import { AppDataSource } from './config/dataSource';

const start = async () => {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('Database connection initialized');

    // Build and start the server
    const app = await buildApp();
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Server is running on port ${port}`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
};

start(); 