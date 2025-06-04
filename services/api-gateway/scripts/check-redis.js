#!/usr/bin/env node

/**
 * This script checks the Redis connection status
 * It helps diagnose issues with the rate limiter
 */

const Redis = require('ioredis');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Directory where this script is located
const scriptDir = __dirname;
// API gateway directory
const apiGatewayDir = path.resolve(scriptDir, '..');
// Load environment variables
const envPath = path.join(apiGatewayDir, '.env');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`Loaded environment from ${envPath}`);
} else {
  dotenv.config();
  console.log('Using default environment variables');
}

// Get Redis URL from environment or use default
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

console.log(`\n🔍 Checking Redis connection at ${redisUrl}...\n`);

// Create Redis client with better error handling options
const redisClient = new Redis(redisUrl, {
  connectTimeout: 5000, // 5 seconds timeout for connection
  maxRetriesPerRequest: 0, // Don't retry requests
  retryStrategy: () => null, // Disable auto-reconnect
  enableOfflineQueue: false, // Don't queue commands when disconnected
});

// Add error handler
redisClient.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
  console.error('\nPossible solutions:');
  console.log('1. Make sure Redis is running');
  console.log('2. Check the REDIS_URL environment variable');
  console.log('3. If Redis is not needed, you can disable it in the .env file');
  
  // Exit with error code
  process.exit(1);
});

// Test connection
redisClient.ping()
  .then(() => {
    console.log('✅ Redis connection successful!');
    console.log('\nRedis info:');
    return redisClient.info();
  })
  .then((info) => {
    // Parse Redis info
    const infoLines = info.split('\n');
    const version = infoLines.find(line => line.startsWith('redis_version'))?.split(':')[1] || 'Unknown';
    const uptime = infoLines.find(line => line.startsWith('uptime_in_seconds'))?.split(':')[1] || 'Unknown';
    const clients = infoLines.find(line => line.startsWith('connected_clients'))?.split(':')[1] || 'Unknown';
    const memory = infoLines.find(line => line.startsWith('used_memory_human'))?.split(':')[1] || 'Unknown';
    
    console.log(`- Version: ${version}`);
    console.log(`- Uptime: ${uptime} seconds`);
    console.log(`- Connected clients: ${clients}`);
    console.log(`- Memory usage: ${memory}`);
    
    console.log('\n✅ Redis is ready to use with the rate limiter');
  })
  .catch((err) => {
    console.error(`❌ Redis connection failed: ${err.message}`);
    console.error('\nPossible solutions:');
    console.log('1. Make sure Redis is running');
    console.log('2. Check the REDIS_URL environment variable');
    console.log('3. If Redis is not needed, you can set REDIS_URL to an empty string in the .env file');
  })
  .finally(() => {
    // Close the connection
    redisClient.disconnect();
  }); 