import { AppDataSource } from '../config/data-source';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import bcrypt from 'bcrypt';
import logger from '../utils/logger';

async function createDemoUser() {
  try {
    // Initialize the database connection
    await AppDataSource.initialize();
    logger.info('Database connection initialized');

    const userRepository = AppDataSource.getRepository(User);

    // Check if demo user exists
    const demoExists = await userRepository.findOne({
      where: { email: 'demo1@example.com' }
    });

    if (demoExists) {
      logger.info('Demo user already exists');
      return;
    }

    // Create demo user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const demoUser = userRepository.create({
      email: 'demo1@example.com',
      password: hashedPassword,
      name: 'Demo User',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true
    });

    const savedUser = await userRepository.save(demoUser);
    logger.info({
      userId: savedUser.id,
      email: savedUser.email,
      role: savedUser.role
    }, 'Demo user created successfully');

  } catch (error) {
    logger.error(error, 'Failed to create demo user');
    throw error;
  } finally {
    // Close the database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Run the script
createDemoUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 