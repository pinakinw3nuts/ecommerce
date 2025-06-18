/**
 * Test Order Creator
 *
 * This script creates a test order in the database for the specified user.
 * Run it with: node create-test-order.js
 */

const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Get database connection string from .env or use default
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/order_db';

// Create a PostgreSQL client
const client = new Client({
  connectionString: DATABASE_URL
});

async function createTestOrder() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    
    // Define test data
    const userId = process.argv[2] || 'test-user-id';  // Allow user ID to be passed as argument
    const orderId = uuidv4();
    const orderNumber = `ORD-${Math.floor(Math.random() * 100000)}`;
    const now = new Date();
    
    // Create test order
    const orderQuery = `
      INSERT INTO orders (
        id, user_id, order_number, status, payment_status, payment_method, 
        total_amount, shipping_address, billing_address, tax_amount, 
        shipping_amount, discount_amount, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id
    `;
    
    const shippingAddress = {
      firstName: 'Test',
      lastName: 'User',
      address1: '123 Main St',
      city: 'Test City',
      state: 'TS',
      postalCode: '12345',
      country: 'Test Country',
      phone: '555-555-5555'
    };
    
    const orderValues = [
      orderId,                   // id
      userId,                    // user_id
      orderNumber,               // order_number
      'PROCESSING',              // status
      'PAID',                    // payment_status
      'CREDIT_CARD',             // payment_method
      99.99,                     // total_amount
      shippingAddress,           // shipping_address (JSON)
      shippingAddress,           // billing_address (JSON)
      8.99,                      // tax_amount
      5.99,                      // shipping_amount
      0,                         // discount_amount
      now,                       // created_at
      now                        // updated_at
    ];
    
    console.log('Creating test order...');
    const orderResult = await client.query(orderQuery, orderValues);
    console.log(`Order created with ID: ${orderResult.rows[0].id}`);
    
    // Create test order items
    const item1Id = uuidv4();
    const item2Id = uuidv4();
    
    const itemQuery = `
      INSERT INTO order_items (
        id, order_id, product_id, quantity, price, name, sku, image, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;
    
    // First item
    await client.query(itemQuery, [
      item1Id,                   // id
      orderId,                   // order_id
      uuidv4(),                  // product_id
      2,                         // quantity
      39.99,                     // price
      'Premium Brake Pads',      // name
      'BP-PREMIUM-001',          // sku
      '/images/products/brake-pads.jpg', // image
      'PROCESSING',              // status
      now,                       // created_at
      now                        // updated_at
    ]);
    
    // Second item
    await client.query(itemQuery, [
      item2Id,                   // id
      orderId,                   // order_id
      uuidv4(),                  // product_id
      1,                         // quantity
      20.01,                     // price
      'Oil Filter',              // name
      'OF-STANDARD-002',         // sku
      '/images/products/oil-filter.jpg', // image
      'PROCESSING',              // status
      now,                       // created_at
      now                        // updated_at
    ]);
    
    console.log(`Added 2 items to order ${orderNumber}`);
    console.log('\nTest order created successfully! Details:');
    console.log('----------------------------------------');
    console.log(`Order ID: ${orderId}`);
    console.log(`Order Number: ${orderNumber}`);
    console.log(`User ID: ${userId}`);
    console.log(`Total: $99.99`);
    console.log(`Created: ${now.toISOString()}`);
    console.log('----------------------------------------');
    
    console.log('\nNow you can test the API endpoints:');
    console.log(`GET http://localhost:3006/api/v1/public/orders`);
    console.log(`GET http://localhost:3006/api/v1/public/orders/${orderId}`);
    
  } catch (error) {
    console.error('Error creating test order:', error);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

createTestOrder().catch(console.error); 