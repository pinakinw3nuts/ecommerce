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

// Service configuration
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
];

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
 * Check all services
 */
async function checkServices() {
  console.log('\n\n');
  console.log('Service'.padEnd(20), 'Port'.padEnd(10), 'Status'.padEnd(20), 'Process Info');
  console.log('----------------------------------------------------------------------');
  
  const results = await Promise.all(services.map(async (service) => {
    const isRunning = await isServiceRunning(service.port);
    const status = isRunning ? 'RUNNING' : 'NOT RUNNING';
    const processInfo = isRunning ? getProcessInfo(service.port) : '';
    
    console.log(
      service.name.padEnd(20),
      String(service.port).padEnd(10),
      status.padEnd(20),
      processInfo
    );
    
    return { service, isRunning };
  }));
  
  const runningCount = results.filter(r => r.isRunning).length;
  
  console.log('\n----------------------------------------------------------------------');
  console.log(`Summary: ${runningCount} of ${services.length} services running`);
  console.log('\n');
}

// Run the check
checkServices(); 