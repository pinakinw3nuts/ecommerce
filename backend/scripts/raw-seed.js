const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'test123',
    database: process.env.DB_NAME || 'ecommerce1',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if admin user exists
    const adminCheck = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@example.com']
    );

    if (adminCheck.rows.length === 0) {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await client.query(`
        INSERT INTO users (email, password, name, role, status, phoneNumber, preferences)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        'admin@example.com',
        hashedPassword,
        'Admin User',
        'ADMIN',
        'ACTIVE',
        '+1234567890',
        JSON.stringify({ theme: 'dark', notifications: true })
      ]);
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Seed categories
    const categories = [
      { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and gadgets' },
      { name: 'Clothing', slug: 'clothing', description: 'Fashion and apparel' },
      { name: 'Home & Garden', slug: 'home-garden', description: 'Home improvement and garden supplies' }
    ];

    for (const category of categories) {
      const existing = await client.query(
        'SELECT id FROM categories WHERE slug = $1',
        [category.slug]
      );
      
      if (existing.rows.length === 0) {
        await client.query(`
          INSERT INTO categories (name, slug, description, "isActive")
          VALUES ($1, $2, $3, $4)
        `, [category.name, category.slug, category.description, true]);
      }
    }
    console.log('✅ Categories seeded');

    // Seed brands
    const brands = [
      { name: 'Apple', slug: 'apple', description: 'Innovative technology products' },
      { name: 'Nike', slug: 'nike', description: 'Athletic footwear and apparel' },
      { name: 'Samsung', slug: 'samsung', description: 'Consumer electronics and appliances' }
    ];

    for (const brand of brands) {
      const existing = await client.query(
        'SELECT id FROM brands WHERE slug = $1',
        [brand.slug]
      );
      
      if (existing.rows.length === 0) {
        await client.query(`
          INSERT INTO brands (name, slug, description, "isActive")
          VALUES ($1, $2, $3, $4)
        `, [brand.name, brand.slug, brand.description, true]);
      }
    }
    console.log('✅ Brands seeded');

    // Seed sample products
    const products = [
      {
        name: 'iPhone 15 Pro',
        slug: 'iphone-15-pro',
        description: 'Latest iPhone with advanced features',
        price: 999.99,
        sku: 'IPHONE-15-PRO-001'
      },
      {
        name: 'Nike Air Max 270',
        slug: 'nike-air-max-270',
        description: 'Comfortable running shoes',
        price: 150.00,
        sku: 'NIKE-AIR-MAX-270-001'
      },
      {
        name: 'Samsung 4K Smart TV',
        slug: 'samsung-4k-smart-tv',
        description: '55-inch 4K Ultra HD Smart TV',
        price: 799.99,
        sku: 'SAMSUNG-TV-55-001'
      }
    ];

    for (const product of products) {
      const existing = await client.query(
        'SELECT id FROM products WHERE slug = $1',
        [product.slug]
      );
      
      if (existing.rows.length === 0) {
        await client.query(`
          INSERT INTO products (name, slug, description, price, sku, "isActive")
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [product.name, product.slug, product.description, product.price, product.sku, true]);
      }
    }
    console.log('✅ Products seeded');

    console.log('🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  } finally {
    await client.end();
  }
}

seedDatabase();
