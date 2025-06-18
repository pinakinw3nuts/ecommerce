/**
 * API Services Starter
 * 
 * This script helps start the required API services for the orders functionality
 * Prerequisites: You must have the order service and API gateway installed
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Paths to services (relative to repository root)
const ROOT_DIR = path.resolve(__dirname, '../..');
const API_GATEWAY_DIR = path.join(ROOT_DIR, 'services/api-gateway');
const ORDER_SERVICE_DIR = path.join(ROOT_DIR, 'services/order-service');

// Check if directories exist
if (!fs.existsSync(API_GATEWAY_DIR)) {
  console.error(`API Gateway directory not found: ${API_GATEWAY_DIR}`);
  process.exit(1);
}

if (!fs.existsSync(ORDER_SERVICE_DIR)) {
  console.error(`Order Service directory not found: ${ORDER_SERVICE_DIR}`);
  process.exit(1);
}

console.log('✅ Found service directories');

// Function to start a service
function startService(name, directory, command, args = []) {
  console.log(`Starting ${name}...`);
  
  const process = spawn(command, args, {
    cwd: directory,
    shell: true,
    stdio: 'inherit'
  });
  
  process.on('error', (error) => {
    console.error(`Failed to start ${name}:`, error);
  });
  
  process.on('close', (code) => {
    if (code !== 0) {
      console.log(`${name} process exited with code ${code}`);
    }
  });
  
  return process;
}

// Start Order Service
const orderService = startService(
  'Order Service',
  ORDER_SERVICE_DIR,
  'npm',
  ['run', 'start:dev']
);

// Give the Order Service a moment to start
setTimeout(() => {
  // Start API Gateway
  const apiGateway = startService(
    'API Gateway',
    API_GATEWAY_DIR,
    'npm',
    ['run', 'start:dev']
  );
  
  // Listen for SIGINT (Ctrl+C) to gracefully shut down services
  process.on('SIGINT', () => {
    console.log('\nShutting down services...');
    
    // Kill processes
    orderService.kill();
    apiGateway.kill();
    
    console.log('Services stopped');
    process.exit(0);
  });
  
  console.log('\n🚀 Services started! Press Ctrl+C to stop.');
  console.log('\n📋 Next steps:');
  console.log('1. Start the storefront app: npm run dev:real-api');
  console.log('2. Navigate to http://localhost:3100/account/orders');
}, 5000); 