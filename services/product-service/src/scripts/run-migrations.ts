import { AppDataSource } from '../config/dataSource';

async function runMigrations() {
  try {
    // Initialize the data source
    await AppDataSource.initialize();
    console.log('Data source initialized');

    // Run migrations
    const migrations = await AppDataSource.runMigrations();
    console.log(`Successfully ran ${migrations.length} migrations`);
    
    // Close the connection
    await AppDataSource.destroy();
    console.log('Connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations(); 