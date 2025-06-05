#!/usr/bin/env node

/**
 * This script checks which microservices are currently running by checking TCP ports only
 * It doesn't rely on health endpoints, just checks if the port is open
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');

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
function isPortInUse(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection(port, 'localhost');
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(false); // Timeout - assume port is not in use
    }, 1000);
    
    socket.on('connect', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(true); // Connection successful - port is in use
    });
    
    socket.on('error', () => {
      clearTimeout(timeout);
      resolve(false); // Connection error - port is not in use
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
 * Check for Swagger UI availability
 */
async function checkSwaggerUI(port) {
  const paths = [
    '/docs/static/index.html',           // Standard Swagger path
    '/documentation/static/index.html',  // Alternative path
    '/swagger/index.html',               // Another alternative
    '/api-docs/index.html',              // Yet another alternative
    '/docs',                             // Simple docs path
    '/documentation',                    // Simple documentation path
    '/swagger',                          // Simple swagger path
    '/api-docs',                         // Simple api-docs path
    '/api/docs',                         // API docs path
    '/swagger-ui',                       // Swagger UI path
    '/swagger-ui.html'                   // Spring Boot style path
  ];
  
  for (const path of paths) {
    const isAvailable = await checkEndpoint(port, path);
    if (isAvailable) {
      return { available: true, path };
    }
  }
  
  return { available: false, path: null };
}

/**
 * Check if an endpoint is available
 */
function checkEndpoint(port, path) {
  return new Promise((resolve) => {
    const http = require('http');
    const req = http.get({
      hostname: 'localhost',
      port,
      path,
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
 * Check all services and apps
 */
async function checkServices() {
  const allEntities = [...services, ...apps];
  const results = { services: [], apps: [] };
  
  console.log('\n=======================================================================');
  console.log('               MICROSERVICES PLATFORM - PORT CHECK');
  console.log('=======================================================================');
  
  console.log('\nService/App'.padEnd(25), 'Port'.padEnd(10), 'Port Active'.padEnd(15), 'Available'.padEnd(15), 'Swagger UI', 'Process Info');
  console.log('----------------------------------------------------------------------------------------------');
  
  let runningCount = 0;
  
  // Check services
  for (const entity of allEntities) {
    const exists = directoryExists(entity.name);
    const isPortActive = await isPortInUse(entity.port);
    const status = isPortActive ? 'ACTIVE' : 'INACTIVE';
    const availability = exists ? 'AVAILABLE' : 'NOT FOUND';
    
    let swaggerStatus = '';
    if (isPortActive) {
      runningCount++;
      const swagger = await checkSwaggerUI(entity.port);
      swaggerStatus = swagger.available ? '✅' : '❌';
    }
    
    const processInfo = isPortActive ? getProcessInfo(entity.port) : '';
    
    console.log(
      entity.name.padEnd(25),
      String(entity.port).padEnd(10),
      status.padEnd(15),
      availability.padEnd(15),
      swaggerStatus.padEnd(15),
      processInfo
    );
    
    const result = { name: entity.name, port: entity.port, isRunning: isPortActive, exists };
    
    if (entity.name === 'storefront' || entity.name === 'admin-panel') {
      results.apps.push(result);
    } else {
      results.services.push(result);
    }
  }
  
  const totalServices = allEntities.length;
  
  console.log('\n----------------------------------------------------------------------------------------------');
  console.log(`Services with Active Ports: ${runningCount} of ${totalServices}`);
  console.log('=======================================================================\n');
  
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