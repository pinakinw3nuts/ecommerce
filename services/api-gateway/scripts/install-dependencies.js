#!/usr/bin/env node

/**
 * This script installs dependencies for all microservices
 * Usage: node install-dependencies.js [service-name]
 * If service-name is provided, only that service's dependencies will be installed
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Directory where this script is located
const scriptDir = __dirname;
// API gateway directory
const apiGatewayDir = path.resolve(scriptDir, '..');
// Root directory
const rootDir = path.resolve(apiGatewayDir, '../..');
// Services directory
const servicesDir = path.join(rootDir, 'services');

// Get service name from command line arguments (optional)
const targetService = process.argv[2];

// Get all service directories
function getServiceDirectories() {
  try {
    return fs.readdirSync(servicesDir)
      .filter(name => {
        const fullPath = path.join(servicesDir, name);
        return fs.statSync(fullPath).isDirectory() && 
               fs.existsSync(path.join(fullPath, 'package.json'));
      });
  } catch (error) {
    console.error('Error reading services directory:', error.message);
    return [];
  }
}

/**
 * Install dependencies for a service
 */
async function installDependencies(serviceName) {
  return new Promise((resolve, reject) => {
    const serviceDir = path.join(servicesDir, serviceName);
    
    if (!fs.existsSync(serviceDir) || !fs.existsSync(path.join(serviceDir, 'package.json'))) {
      console.log(`Skipping ${serviceName}: No package.json found`);
      return resolve(false);
    }
    
    console.log(`\n📦 Installing dependencies for ${serviceName}...`);
    
    const child = spawn('pnpm', ['install'], {
      cwd: serviceDir,
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

/**
 * Main function
 */
async function main() {
  // Check if pnpm is installed
  try {
    execSync('pnpm --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ pnpm is not installed. Please install it first:');
    console.log('npm install -g pnpm');
    process.exit(1);
  }
  
  let services;
  
  if (targetService) {
    // Install for a specific service
    if (!fs.existsSync(path.join(servicesDir, targetService))) {
      console.error(`❌ Service "${targetService}" not found`);
      process.exit(1);
    }
    services = [targetService];
  } else {
    // Install for all services
    services = getServiceDirectories();
    
    if (services.length === 0) {
      console.error('❌ No services found with package.json files');
      process.exit(1);
    }
    
    console.log(`Found ${services.length} services: ${services.join(', ')}`);
  }
  
  // Install dependencies for each service
  const results = [];
  for (const service of services) {
    try {
      const success = await installDependencies(service);
      results.push({ service, success });
    } catch (error) {
      results.push({ service, success: false, error: error.message });
    }
  }
  
  // Print summary
  console.log('\n📋 Installation Summary:');
  console.log('--------------------------------------------------');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  successful.forEach(({ service }) => {
    console.log(`✅ ${service}: Dependencies installed successfully`);
  });
  
  failed.forEach(({ service, error }) => {
    console.log(`❌ ${service}: Failed to install dependencies${error ? ` (${error})` : ''}`);
  });
  
  console.log('--------------------------------------------------');
  console.log(`Total: ${results.length}, Successful: ${successful.length}, Failed: ${failed.length}`);
  
  if (failed.length > 0) {
    process.exit(1);
  }
}

// Run the main function
main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
}); 