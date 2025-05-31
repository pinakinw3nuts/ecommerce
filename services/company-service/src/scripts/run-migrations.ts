import { AppDataSource } from '../config/dataSource';
import logger from '../utils/logger';

/**
 * Script to run database migrations
 */
async function runMigrations() {
  try {
    // Initialize the data source
    await AppDataSource.initialize();
    logger.info('Database connection established');
    
    // Check for pending migrations
    const pendingMigrations = await AppDataSource.showMigrations();
    
    if (!pendingMigrations) {
      logger.info('No pending migrations to run');
      await AppDataSource.destroy();
      return;
    }
    
    // Run migrations
    logger.info('Running migrations...');
    const migrations = await AppDataSource.runMigrations();
    
    if (migrations.length === 0) {
      logger.info('No migrations were executed');
    } else {
      logger.info(`Successfully ran ${migrations.length} migrations:`);
      migrations.forEach(migration => {
        logger.info(`- ${migration.name}`);
      });
    }
    
    // Close the connection
    await AppDataSource.destroy();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error running migrations:', error);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

// Run the migrations
runMigrations()
  .then(() => {
    logger.info('Migration process completed');
    process.exit(0);
  })
  .catch(error => {
    logger.error('Migration process failed:', error);
    process.exit(1);
  }); 