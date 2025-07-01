import { DataSource } from 'typeorm';
import { config } from '../config/env';
import { Payment } from '../entities/payment.entity';
import { PaymentMethod } from '../entities/payment-method.entity';
import { PaymentGateway } from '../entities/payment-gateway.entity';
import { UpdatePaymentMethodEntity1720000000000 } from '../migrations/1720000000000-UpdatePaymentMethodEntity';
import { CreatePaymentGatewayEntity1720000000001 } from '../migrations/1720000000001-CreatePaymentGatewayEntity';

async function runMigrations() {
  console.log('Initializing database connection...');
  
  const dataSource = new DataSource({
    type: 'postgres',
    host: config.database.host,
    port: config.database.port,
    username: config.database.username,
    password: config.database.password,
    database: config.database.database,
    entities: [Payment, PaymentMethod, PaymentGateway],
    migrations: [
      UpdatePaymentMethodEntity1720000000000,
      CreatePaymentGatewayEntity1720000000001
    ],
    synchronize: false,
    logging: true
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    console.log('Running migrations...');
    await dataSource.runMigrations();
    console.log('Migrations completed successfully');

    await dataSource.destroy();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations().catch(console.error); 