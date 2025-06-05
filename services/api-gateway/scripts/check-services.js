#!/usr/bin/env node

/**
 * This script checks which microservices are currently running
 */

const http = require('http');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Directory where this script is located
const scriptDir = __dirname;
// API gateway directory
const apiGatewayDir = path.resolve(scriptDir, '..');
// Root directory
const rootDir = path.resolve(apiGatewayDir, '../..');

// Service configuration with standardized ports
const services = [
  { name: 'api-gateway', port: 3000 },
  { name: 'auth-service', port: 3001 },
  { name: 'user-service', port: 3002 },
  { name: 'product-service', port: 3003 },
  { name: 'cart-service', port: 3004 },
  { name: 'checkout-service', port: 3005 },
  { name: 'order-service', port: 3006 },
  { name: 'payment-service', port: 3007 },
  { name: 'shipping-service', port: 3008 },
  { name: 'inventory-service', port: 3009 },
  { name: 'company-service', port: 3010 },
  { name: 'pricing-service', port: 3011 },
  { name: 'admin-service', port: 3012 },
  { name: 'wishlist-service', port: 3013 },
  { name: 'review-service', port: 3014 },
  { name: 'notification-service', port: 3015 },
  { name: 'cms-service', port: 3016 },
];

// Apps configuration
const apps = [
  { name: 'storefront', port: 3100 },
  { name: 'admin-panel', port: 3200 },
];

/**
 * Check if a directory exists
 */
function directoryExists(serviceName) {
  if (serviceName === 'api-gateway') {
    // Special case for API gateway
    return fs.existsSync(apiGatewayDir);
  } else if (serviceName === 'storefront' || serviceName === 'admin-panel') {
    // Apps are in a different directory
    const appPath = path.join(rootDir, 'apps', serviceName);
    return fs.existsSync(appPath);
  }
  
  // Check the direct path in services directory
  const servicePath = path.join(rootDir, 'services', serviceName);
  return fs.existsSync(servicePath);
}

/**
 * Check if a service is running by checking if its port is in use
 */
function isServiceRunning(port) {
  return new Promise((resolve) => {
    // Simple TCP connection test to check if port is in use
    const socket = require('net').createConnection(port, 'localhost');
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(false); // Timeout - assume service is not running
    }, 1000);
    
    socket.on('connect', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(true); // Connection successful - service is running
    });
    
    socket.on('error', () => {
      clearTimeout(timeout);
      resolve(false); // Connection error - service is not running
    });
  });
}

/**
 * Get process info for a port
 */
function getProcessInfo(port) {
  try {
    // Using netstat to find the process using the port
    const command = process.platform === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port} | grep LISTEN`;
    
    const output = execSync(command, { encoding: 'utf8' });
    const lines = output.split('\n').filter(Boolean);
    
    if (lines.length > 0) {
      // Extract PID from the output
      let pid;
      if (process.platform === 'win32') {
        // Windows netstat output format
        const match = lines[0].match(/\s+(\d+)$/);
        pid = match ? match[1] : 'Unknown';
      } else {
        // Unix lsof output format
        const match = lines[0].match(/\s+(\d+)\s+/);
        pid = match ? match[1] : 'Unknown';
      }
      
      return `PID: ${pid}`;
    }
    
    return 'Process info unavailable';
  } catch (error) {
    return 'Process info unavailable';
  }
}

/**
 * Check all services and apps
 */
async function checkServices(options = {}) {
  const allEntities = [...services, ...apps];
  const results = { services: [], apps: [] };
  
  console.log('\n\n');
  console.log('Service/App'.padEnd(25), 'Port'.padEnd(10), 'Status'.padEnd(15), 'Available'.padEnd(15), 'Process Info');
  console.log('--------------------------------------------------------------------------------');
  
  // Check services
  for (const entity of allEntities) {
    const exists = directoryExists(entity.name);
    const isRunning = await isServiceRunning(entity.port);
    const status = isRunning ? 'RUNNING' : 'NOT RUNNING';
    const availability = exists ? 'AVAILABLE' : 'NOT FOUND';
    const processInfo = isRunning ? getProcessInfo(entity.port) : '';
    
    console.log(
      entity.name.padEnd(25),
      String(entity.port).padEnd(10),
      status.padEnd(15),
      availability.padEnd(15),
      processInfo
    );
    
    const result = { name: entity.name, port: entity.port, isRunning, exists };
    
    if (entity.name === 'storefront' || entity.name === 'admin-panel') {
      results.apps.push(result);
    } else {
      results.services.push(result);
    }
  }
  
  const runningServices = results.services.filter(r => r.isRunning).length;
  const totalAvailableServices = results.services.filter(r => r.exists).length;
  
  const runningApps = results.apps.filter(r => r.isRunning).length;
  const totalAvailableApps = results.apps.filter(r => r.exists).length;
  
  console.log('\n--------------------------------------------------------------------------------');
  console.log(`Services Summary: ${runningServices} of ${totalAvailableServices} available services running`);
  console.log(`Apps Summary: ${runningApps} of ${totalAvailableApps} available apps running`);
  console.log('\n');
  
  return results;
}

// Run the check if this script is executed directly
if (require.main === module) {
  checkServices();
}

// Export the function for use in other scripts
module.exports = {
  checkServices
}; 