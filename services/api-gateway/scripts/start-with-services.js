#!/usr/bin/env node

/**
 * This script starts all services and then the API gateway.
 * It provides better error handling and service status reporting.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { checkServices } = require('./check-services');

// Directory where this script is located
const scriptDir = __dirname;
// API gateway directory
const apiGatewayDir = path.resolve(scriptDir, '..');
// Root directory
const rootDir = path.resolve(apiGatewayDir, '../..');

// Store timer for status checks
let statusCheckTimer = null;

// Check if services exist before trying to start them
function checkAvailableServices() {
  const servicesDir = path.join(rootDir, 'services');
  const expectedServices = [
    'auth-service',
    'user-service',
    'product-service',
    'cart-service',
    'checkout-service',
    'order-service',
    'payment-service',
    'shipping-service',
    'inventory-service',
    'company-service',
    'pricing-service',
    'admin-service',
    'wishlist-service',
    'review-service',
    'notification-service',
    'cms-service',
  ];
  
  console.log('Checking for available services...');
  
  const availableServices = expectedServices.filter(service => {
    const servicePath = path.join(servicesDir, service);
    const exists = fs.existsSync(servicePath);
    console.log(`${service}: ${exists ? 'Available' : 'Not found'} (${servicePath})`);
    return exists;
  });
  
  return availableServices;
}

// Start periodic status checks
function startStatusChecks(interval = 60000) {
  console.log(`\nStarting service status checks (every ${interval/1000} seconds)`);
  
  // Run the first check after a short delay
  setTimeout(async () => {
    await checkServices();
  }, 10000);
  
  // Set up periodic checks
  statusCheckTimer = setInterval(async () => {
    await checkServices();
  }, interval);
}

// Stop periodic status checks
function stopStatusChecks() {
  if (statusCheckTimer) {
    clearInterval(statusCheckTimer);
    statusCheckTimer = null;
  }
}

// Start services in background
console.log('Starting all microservices...');
const availableServices = checkAvailableServices();

if (availableServices.length === 0) {
  console.log('No services found to start. Starting API Gateway only.');
  startApiGateway();
} else {
  const servicesProcess = spawn(
    'node', 
    ['-r', 'ts-node/register', path.join(scriptDir, 'start-services.ts')], 
    {
      cwd: apiGatewayDir,
      stdio: 'inherit',
      shell: true,
    }
  );

  // Handle services process events
  servicesProcess.on('error', (err) => {
    console.error('Failed to start services:', err);
    startApiGateway();
  });

  // Wait to ensure services have time to start
  setTimeout(() => {
    startApiGateway(servicesProcess);
    
    // Start periodic status checks
    startStatusChecks();
  }, 5000); // Wait 5 seconds before starting API gateway
}

function startApiGateway(servicesProcess = null) {
  console.log('\nStarting API Gateway...');
  const apiGatewayProcess = spawn(
    'pnpm', 
    ['run', 'dev'], 
    {
      cwd: apiGatewayDir,
      stdio: 'inherit',
      shell: true,
    }
  );

  // Handle API gateway process events
  apiGatewayProcess.on('error', (err) => {
    console.error('Failed to start API Gateway:', err);
    stopStatusChecks();
    if (servicesProcess) servicesProcess.kill();
    process.exit(1);
  });

  apiGatewayProcess.on('close', (code) => {
    console.log(`API Gateway process exited with code ${code}`);
    stopStatusChecks();
    if (servicesProcess) servicesProcess.kill();
    process.exit(code || 0);
  });
}

// Add command handler to check services on demand
process.stdin.on('data', (data) => {
  const input = data.toString().trim().toLowerCase();
  
  if (input === 'status' || input === 'check') {
    checkServices();
  } else if (input === 'help') {
    console.log('\nAvailable commands:');
    console.log('  status, check - Check the status of all services');
    console.log('  help          - Show this help message');
    console.log('  exit, quit    - Exit the application');
  } else if (input === 'exit' || input === 'quit') {
    console.log('Shutting down...');
    stopStatusChecks();
    process.exit(0);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down...');
  stopStatusChecks();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down...');
  stopStatusChecks();
  process.exit(0);
}); 