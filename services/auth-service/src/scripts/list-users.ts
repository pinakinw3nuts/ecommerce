import { AppDataSource } from '../config/data-source';
import { User } from '../entities/user.entity';
import logger from '../utils/logger';

async function listUsers() {
  try {
    // Initialize the database connection
    await AppDataSource.initialize();
    logger.info('Database connection initialized');

    const userRepository = AppDataSource.getRepository(User);

    // Get all users with selected fields
    const users = await userRepository.find({
      select: ['id', 'email', 'name', 'role', 'status', 'isEmailVerified', 'lastLogin', 'createdAt']
    });

    console.log('\nExisting Users:');
    console.log('==============');
    users.forEach(user => {
      console.log(`\nUser ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Role: ${user.role}`);
      console.log(`Status: ${user.status}`);
      console.log(`Email Verified: ${user.isEmailVerified}`);
      console.log(`Last Login: ${user.lastLogin || 'Never'}`);
      console.log(`Created At: ${user.createdAt}`);
      console.log('------------------------');
    });

    console.log(`\nTotal Users: ${users.length}`);

  } catch (error) {
    logger.error(error, 'Failed to list users');
    throw error;
  } finally {
    // Close the database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Run the script
listUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 