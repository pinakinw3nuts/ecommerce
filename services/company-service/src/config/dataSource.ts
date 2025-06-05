import { DataSource } from 'typeorm';
import { env } from './env';
import { Company } from '../entities/Company';
import { CompanyUser } from '../entities/CompanyUser';
import { CompanyProfile } from '../entities/CompanyProfile';
import { EnableUuidExtension1689000000000 } from '../migrations/1689000000000-EnableUuidExtension';
import { CreateInitialTables1690000000000 } from '../migrations/1690000000000-CreateInitialTables';

// Create TypeORM data source
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  entities: [Company, CompanyUser, CompanyProfile],
  // Disable synchronize to avoid conflicts with migrations
  synchronize: false,
  // Enable logging in development
  logging: false,
  // SSL configuration for production environments (e.g. Heroku)
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Include migrations
  migrations: [EnableUuidExtension1689000000000, CreateInitialTables1690000000000],
  // Run migrations automatically
  migrationsRun: true,
});

// Initialize data source and export
export const initializeDataSource = async (): Promise<DataSource> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Data Source has been initialized!');
      
      // Run migrations if not already run
      const pendingMigrations = await AppDataSource.showMigrations();
      if (pendingMigrations) {
        console.log('Running pending migrations...');
        await AppDataSource.runMigrations();
        console.log('Migrations completed successfully');
      }
    }
    return AppDataSource;
  } catch (error) {
    console.error('Error during Data Source initialization:', error);
    throw error;
  }
};

// Export for testing
export default AppDataSource; 