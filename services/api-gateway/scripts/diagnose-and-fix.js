#!/usr/bin/env node

/**
 * This script diagnoses and fixes common issues with the API gateway and services
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const readline = require('readline');

// Directory where this script is located
const scriptDir = __dirname;
// API gateway directory
const apiGatewayDir = path.resolve(scriptDir, '..');
// Root directory
const rootDir = path.resolve(apiGatewayDir, '../..');
// Services directory
const servicesDir = path.join(rootDir, 'services');

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

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt user for confirmation
function confirm(question) {
  return new Promise((resolve) => {
    rl.question(`${question} (y/n): `, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Check if a service is running
async function isServiceRunning(serviceName) {
  const port = servicePorts[serviceName];
  if (!port) return false;
  
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

// Check if a service directory exists
function serviceExists(serviceName) {
  const servicePath = path.join(servicesDir, serviceName);
  return fs.existsSync(servicePath);
}

// Check if a service has node_modules
function hasNodeModules(serviceName) {
  const nodeModulesPath = path.join(servicesDir, serviceName, 'node_modules');
  return fs.existsSync(nodeModulesPath);
}

// Install dependencies for a service
async function installDependencies(serviceName) {
  return new Promise((resolve, reject) => {
    console.log(`\n📦 Installing dependencies for ${serviceName}...`);
    
    const child = spawn('pnpm', ['install'], {
      cwd: path.join(servicesDir, serviceName),
      shell: true,
      stdio: 'inherit',
    });
    
    child.on('error', (err) => {
      console.error(`Failed to install dependencies for ${serviceName}:`, err);
      reject(err);
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Dependencies installed for ${serviceName}`);
        resolve(true);
      } else {
        console.error(`❌ Failed to install dependencies for ${serviceName} (exit code: ${code})`);
        resolve(false);
      }
    });
  });
}

// Start a service
async function startService(serviceName) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Starting ${serviceName}...`);
    
    const child = spawn('node', [path.join(scriptDir, 'ensure-service.js'), serviceName], {
      stdio: 'inherit',
      shell: true,
    });
    
    child.on('error', (err) => {
      console.error(`Failed to start ${serviceName}:`, err);
      reject(err);
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${serviceName} started successfully`);
        resolve(true);
      } else {
        console.error(`❌ Failed to start ${serviceName} (exit code: ${code})`);
        resolve(false);
      }
    });
  });
}

// Check for port conflicts
async function checkPortConflicts(serviceName) {
  const port = servicePorts[serviceName];
  if (!port) return false;
  
  try {
    let command;
    if (process.platform === 'win32') {
      command = `netstat -ano | findstr :${port}`;
    } else {
      command = `lsof -i :${port} -P -n`;
    }
    
    const result = execSync(command, { encoding: 'utf-8' });
    
    if (result && result.trim()) {
      console.log(`\n⚠️ Port ${port} is already in use:`);
      console.log(result);
      return true;
    }
  } catch (error) {
    // No conflict if command fails (usually means no process is using the port)
    return false;
  }
  
  return false;
}

// Check Redis connection
async function checkRedis() {
  return new Promise((resolve) => {
    const child = spawn('node', [path.join(scriptDir, 'check-redis.js')], {
      stdio: 'inherit',
      shell: true,
    });
    
    child.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

// Main function
async function main() {
  console.log('\n🔍 Starting diagnostic check...');
  
  // Check if API Gateway is running
  console.log('\n📡 Checking API Gateway status...');
  const isApiGatewayRunning = await isServiceRunning('api-gateway');
  
  if (isApiGatewayRunning) {
    console.log('✅ API Gateway is running');
  } else {
    console.log('❌ API Gateway is not running');
    
    // Check for port conflict
    const hasConflict = await checkPortConflicts('api-gateway');
    
    if (hasConflict) {
      console.log('\n⚠️ Port 3000 is already in use. Options:');
      console.log('1. Kill the process using port 3000');
      console.log('2. Start API Gateway on a different port');
      
      const useAltPort = await confirm('Would you like to start API Gateway on port 3030?');
      
      if (useAltPort) {
        console.log('\nStarting API Gateway on port 3030...');
        execSync('node scripts/start-on-port.js 3030', {
          cwd: apiGatewayDir,
          stdio: 'inherit',
        });
      }
    } else {
      const startGateway = await confirm('Would you like to start the API Gateway?');
      
      if (startGateway) {
        console.log('\nStarting API Gateway...');
        execSync('pnpm run dev:no-redis', {
          cwd: apiGatewayDir,
          stdio: 'inherit',
        });
      }
    }
  }
  
  // Check Redis connection
  console.log('\n📡 Checking Redis connection...');
  const redisOk = await checkRedis();
  
  if (!redisOk) {
    console.log('⚠️ Redis is not available. Rate limiting will use in-memory store.');
    console.log('This is fine for development but not recommended for production.');
  }
  
  // Check services
  console.log('\n📡 Checking microservices status...');
  
  const serviceStatus = {};
  const missingDeps = [];
  
  for (const serviceName of Object.keys(servicePorts)) {
    if (serviceName === 'api-gateway') continue;
    
    const exists = serviceExists(serviceName);
    const hasModules = exists && hasNodeModules(serviceName);
    const isRunning = await isServiceRunning(serviceName);
    
    serviceStatus[serviceName] = { exists, hasModules, isRunning };
    
    if (exists && !hasModules) {
      missingDeps.push(serviceName);
    }
    
    console.log(`${serviceName}: ${isRunning ? '✅ Running' : '❌ Not running'}`);
  }
  
  // Fix missing dependencies
  if (missingDeps.length > 0) {
    console.log(`\n⚠️ The following services are missing dependencies: ${missingDeps.join(', ')}`);
    
    const installMissing = await confirm('Would you like to install missing dependencies?');
    
    if (installMissing) {
      for (const service of missingDeps) {
        await installDependencies(service);
      }
    }
  }
  
  // Ask which services to start
  const notRunning = Object.keys(serviceStatus).filter(
    service => serviceStatus[service].exists && !serviceStatus[service].isRunning
  );
  
  if (notRunning.length > 0) {
    console.log(`\n⚠️ The following services are not running: ${notRunning.join(', ')}`);
    
    const startAll = await confirm('Would you like to start all missing services?');
    
    if (startAll) {
      for (const service of notRunning) {
        await startService(service);
      }
    } else {
      for (const service of notRunning) {
        const startThis = await confirm(`Start ${service}?`);
        if (startThis) {
          await startService(service);
        }
      }
    }
  }
  
  console.log('\n✅ Diagnostic check completed.');
  rl.close();
}

// Run the main function
main().catch(err => {
  console.error('Error:', err);
  rl.close();
  process.exit(1);
}); 