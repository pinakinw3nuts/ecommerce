const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'test123',
    database: process.env.DB_NAME || 'ecommerce1',
  });

  try {
    await client.connect();
    console.log('✅ Database connection successful');

    // Test a simple query
    const result = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`📊 Users in database: ${result.rows[0].count}`);

    // Test categories
    const categories = await client.query('SELECT COUNT(*) as count FROM categories');
    console.log(`📊 Categories in database: ${categories.rows[0].count}`);

    // Test products
    const products = await client.query('SELECT COUNT(*) as count FROM products');
    console.log(`📊 Products in database: ${products.rows[0].count}`);

    console.log('🎉 Database is ready!');

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await client.end();
  }
}

testConnection();
