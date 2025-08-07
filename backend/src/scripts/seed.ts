import 'reflect-metadata';
import { initializeDatabase } from '../config/database';

async function main() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Initialize database connection
    await initializeDatabase();
    
    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
