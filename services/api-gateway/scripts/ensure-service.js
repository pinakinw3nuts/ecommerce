#!/usr/bin/env node

/**
 * This script ensures that a specific microservice is running
 * Usage: node ensure-service.js <service-name>
 * Example: node ensure-service.js auth-service
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Directory where this script is located
const scriptDir = __dirname;
// API gateway directory
const apiGatewayDir = path.resolve(scriptDir, '..');
// Root directory
const rootDir = path.resolve(apiGatewayDir, '../..');

// Service port mapping
const servicePorts = {
  'api-gateway': 3000,
  'auth-service': 3001,
  'user-service': 3002,
  'product-service': 3003,
  'cart-service': 3004,
  'checkout-service': 3005,
  'order-service': 3006,
  'payment-service': 3007,
  'shipping-service': 3008,
  'inventory-service': 3009,
  'company-service': 3010,
  'pricing-service': 3011,
  'admin-service': 3012,
};

// Get service name from command line arguments
const serviceName = process.argv[2];

if (!serviceName) {
  console.error('Error: Service name is required');
  console.log('Usage: node ensure-service.js <service-name>');
  console.log('Example: node ensure-service.js auth-service');
  process.exit(1);
}

if (!servicePorts[serviceName]) {
  console.error(`Error: Unknown service "${serviceName}"`);
  console.log('Available services:');
  Object.keys(servicePorts).forEach(name => {
    console.log(`- ${name}`);
  });
  process.exit(1);
}

/**
 * Check if a service is running
 */
function isServiceRunning(port) {
  return new Promise((resolve) => {
    const req = http.get({
      hostname: 'localhost',
      port,
      path: '/health',
      timeout: 1000,
    }, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Check if a service directory exists
 */
function serviceExists(serviceName) {
  const servicePath = path.join(rootDir, 'services', serviceName);
  return fs.existsSync(servicePath);
}

/**
 * Start a service
 */
function startService(serviceName) {
  return new Promise((resolve, reject) => {
    const serviceDir = path.join(rootDir, 'services', serviceName);
    
    if (!fs.existsSync(serviceDir)) {
      return reject(new Error(`Service directory not found: ${serviceDir}`));
    }
    
    console.log(`Starting ${serviceName}...`);
    
    const child = spawn('pnpm', ['run', 'dev'], {
      cwd: serviceDir,
      shell: true,
      stdio: 'pipe', // Capture output
      detached: true, // Run in background
    });
    
    // Handle stdout
    child.stdout.on('data', (data) => {
      console.log(`[${serviceName}] ${data.toString().trim()}`);
    });
    
    // Handle stderr
    child.stderr.on('data', (data) => {
      console.error(`[${serviceName}] ERROR: ${data.toString().trim()}`);
    });
    
    // Handle process exit
    child.on('error', (err) => {
      console.error(`Failed to start ${serviceName}:`, err);
      reject(err);
    });
    
    // Unref the child to allow the parent process to exit
    child.unref();
    
    // Wait longer to ensure the service has time to start
    setTimeout(() => {
      console.log(`${serviceName} started successfully.`);
      resolve();
    }, 10000); // Increased from 5000 to 10000 ms
  });
}

/**
 * Main function
 */
async function main() {
  const port = servicePorts[serviceName];
  
  console.log(`Checking if ${serviceName} is running on port ${port}...`);
  
  const isRunning = await isServiceRunning(port);
  
  if (isRunning) {
    console.log(`✅ ${serviceName} is already running on port ${port}`);
    process.exit(0);
  }
  
  console.log(`❌ ${serviceName} is not running`);
  
  if (!serviceExists(serviceName)) {
    console.error(`Error: Service directory not found for ${serviceName}`);
    process.exit(1);
  }
  
  try {
    await startService(serviceName);
    
    // Check if service started successfully
    const isNowRunning = await isServiceRunning(port);
    
    if (isNowRunning) {
      console.log(`✅ ${serviceName} is now running on port ${port}`);
      process.exit(0);
    } else {
      console.error(`❌ Failed to start ${serviceName}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error starting ${serviceName}:`, error.message);
    process.exit(1);
  }
}

// Run the main function
main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
}); 