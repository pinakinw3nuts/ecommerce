#!/usr/bin/env node

/**
 * Database setup script for inventory-service
 * 
 * This script creates the necessary database and tables for the inventory service
 */

const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const {
  DB_HOST = 'localhost',
  DB_PORT = 5432,
  DB_USERNAME = 'postgres',
  DB_PASSWORD = 'postgres',
  DB_DATABASE = 'inventory_service'
} = process.env;

async function setupDatabase() {
  // Connect to postgres to create database if it doesn't exist
  const client = new Client({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: 'postgres' // Connect to default postgres database
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Check if database exists
    const dbCheckResult = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [DB_DATABASE]
    );

    if (dbCheckResult.rows.length === 0) {
      console.log(`Creating database: ${DB_DATABASE}`);
      await client.query(`CREATE DATABASE ${DB_DATABASE}`);
      console.log(`Database ${DB_DATABASE} created successfully`);
    } else {
      console.log(`Database ${DB_DATABASE} already exists`);
    }

    // Close connection to postgres
    await client.end();
    console.log('Initial connection closed');

    // Connect to the inventory service database
    const dbClient = new Client({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USERNAME,
      password: DB_PASSWORD,
      database: DB_DATABASE
    });

    await dbClient.connect();
    console.log(`Connected to ${DB_DATABASE} database`);

    // Create extensions if needed
    await dbClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('UUID extension enabled');

    console.log('Database setup complete');
    await dbClient.end();
  } catch (err) {
    console.error('Error setting up database:', err);
    process.exit(1);
  }
}

setupDatabase(); 