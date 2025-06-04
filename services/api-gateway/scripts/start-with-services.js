#!/usr/bin/env node

/**
 * This script starts all services and then the API gateway.
 * It provides better error handling and service status reporting.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Directory where this script is located
const scriptDir = __dirname;
// API gateway directory
const apiGatewayDir = path.resolve(scriptDir, '..');
// Root directory
const rootDir = path.resolve(apiGatewayDir, '../..');

// Check if services exist before trying to start them
function checkServices() {
  const servicesDir = path.join(rootDir, 'services');
  const expectedServices = [
    'auth-service',
    'user-service',
    'product-service',
    'cart-service',
    'checkout-service',
    'order-service'
  ];
  
  console.log('Checking for available services...');
  
  const availableServices = expectedServices.filter(service => {
    const servicePath = path.join(servicesDir, service);
    const exists = fs.existsSync(servicePath);
    console.log(`${service}: ${exists ? 'Available' : 'Not found'}`);
    return exists;
  });
  
  return availableServices;
}

// Start services in background
console.log('Starting all microservices...');
const availableServices = checkServices();

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
    if (servicesProcess) servicesProcess.kill();
    process.exit(1);
  });

  apiGatewayProcess.on('close', (code) => {
    console.log(`API Gateway process exited with code ${code}`);
    if (servicesProcess) servicesProcess.kill();
    process.exit(code || 0);
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down...');
  process.exit(0);
}); 