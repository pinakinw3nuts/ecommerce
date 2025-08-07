import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import * as bcrypt from 'bcryptjs';

async function seedAdminUser() {
  try {
    const userRepository = AppDataSource.getRepository('users');
    
    // Check if admin user already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@example.com' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = userRepository.create({
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      status: 'ACTIVE',
      phone: '+1234567890',
      preferences: { theme: 'dark', notifications: true }
    });

    await userRepository.save(adminUser);
    console.log('✅ Admin user created successfully');
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }
}

async function seedBasicData() {
  try {
    const categoryRepository = AppDataSource.getRepository('categories');
    const brandRepository = AppDataSource.getRepository('brands');

    // Create sample categories
    const categories = [
      { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and gadgets' },
      { name: 'Clothing', slug: 'clothing', description: 'Fashion and apparel' },
      { name: 'Home & Garden', slug: 'home-garden', description: 'Home improvement and garden supplies' }
    ];

    for (const categoryData of categories) {
      const existing = await categoryRepository.findOne({ where: { slug: categoryData.slug } });
      if (!existing) {
        const category = categoryRepository.create(categoryData);
        await categoryRepository.save(category);
      }
    }

    // Create sample brands
    const brands = [
      { name: 'Apple', slug: 'apple', description: 'Innovative technology products' },
      { name: 'Nike', slug: 'nike', description: 'Athletic footwear and apparel' },
      { name: 'Samsung', slug: 'samsung', description: 'Consumer electronics and appliances' }
    ];

    for (const brandData of brands) {
      const existing = await brandRepository.findOne({ where: { slug: brandData.slug } });
      if (!existing) {
        const brand = brandRepository.create(brandData);
        await brandRepository.save(brand);
      }
    }

    console.log('✅ Basic data seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding basic data:', error.message);
  }
}

async function main() {
  try {
    console.log('🌱 Starting simple database seeding...');
    
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connection established');
    
    // Seed data
    await seedAdminUser();
    await seedBasicData();
    
    console.log('✅ Simple seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

main();
