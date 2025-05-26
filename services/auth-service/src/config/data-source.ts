import { DataSource } from 'typeorm';
import { configTyped } from './env';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configTyped.db.host,
  port: configTyped.db.port,
  username: configTyped.db.username,
  password: configTyped.db.password,
  database: configTyped.db.database,
  synchronize: configTyped.db.synchronize,
  logging: configTyped.db.logging,
  entities: ['src/entities/**/*.ts'],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.ts']
});

// Initialize if this file is run directly
if (require.main === module) {
  AppDataSource.initialize()
    .then(() => {
      console.log('Data Source has been initialized!');
    })
    .catch((err) => {
      console.error('Error during Data Source initialization:', err);
    });
}

export default AppDataSource; 