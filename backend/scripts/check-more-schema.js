const { Client } = require('pg');
require('dotenv').config();

async function checkMoreSchema() {
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

    const tables = ['categories', 'brands', 'products', 'product_variants', 'shipping_providers'];
    
    for (const table of tables) {
      console.log(`\n🔍 Checking ${table} table structure:`);
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = '${table}' 
        ORDER BY ordinal_position
      `);
      
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkMoreSchema();
