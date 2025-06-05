#!/usr/bin/env node

/**
 * This script installs dependencies for all services in the project
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Directory where this script is located
const scriptDir = __dirname;
// API gateway directory
const apiGatewayDir = path.resolve(scriptDir, '..');
// Root directory
const rootDir = path.resolve(apiGatewayDir, '../../');

// Services to check for dependencies
const services = [
  'api-gateway',
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

// Apps to check for dependencies
const apps = [
  'storefront',
  'admin-panel',
];

/**
 * Check if a directory exists in services
 */
function directoryExists(type, name) {
  let dirPath;
  
  if (type === 'service') {
    if (name === 'api-gateway') {
      dirPath = apiGatewayDir;
    } else {
      dirPath = path.join(rootDir, 'services', name);
    }
  } else if (type === 'app') {
    dirPath = path.join(rootDir, 'apps', name);
  }
  
  return fs.existsSync(dirPath);
}

/**
 * Get the path to a service or app
 */
function getPath(type, name) {
  if (type === 'service') {
    if (name === 'api-gateway') {
      return apiGatewayDir;
    }
    return path.join(rootDir, 'services', name);
  } else if (type === 'app') {
    return path.join(rootDir, 'apps', name);
  }
}

/**
 * Install dependencies for a service or app
 */
async function installDependencies(type, name) {
  return new Promise((resolve, reject) => {
    if (!directoryExists(type, name)) {
      console.log(`${type} '${name}' not found. Skipping.`);
      resolve(false);
      return;
    }
    
    const dirPath = getPath(type, name);
    
    // Check if package.json exists
    if (!fs.existsSync(path.join(dirPath, 'package.json'))) {
      console.log(`No package.json found for ${type} '${name}'. Skipping.`);
      resolve(false);
      return;
    }
    
    console.log(`Installing dependencies for ${type} '${name}'...`);
    
    // Use pnpm to install dependencies
    const child = spawn('pnpm', ['install'], {
      cwd: dirPath,
      shell: true,
      stdio: 'inherit',
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`Failed to install dependencies for ${type} '${name}'.`);
        resolve(false);
      } else {
        console.log(`Dependencies installed successfully for ${type} '${name}'.`);
        resolve(true);
      }
    });
    
    child.on('error', (err) => {
      console.error(`Error installing dependencies for ${type} '${name}':`, err);
      resolve(false);
    });
  });
}

/**
 * Main function to install dependencies for all services and apps
 */
async function installAllDependencies() {
  console.log('\n======================================================');
  console.log('   INSTALLING DEPENDENCIES FOR ALL SERVICES AND APPS');
  console.log('======================================================\n');
  
  const serviceResults = [];
  const appResults = [];
  
  // Install dependencies for all services
  console.log('Installing dependencies for services...\n');
  for (const service of services) {
    const result = await installDependencies('service', service);
    serviceResults.push({ name: service, success: result });
  }
  
  // Install dependencies for all apps
  console.log('\nInstalling dependencies for apps...\n');
  for (const app of apps) {
    const result = await installDependencies('app', app);
    appResults.push({ name: app, success: result });
  }
  
  // Print summary
  console.log('\n======================================================');
  console.log('                   INSTALLATION SUMMARY');
  console.log('======================================================');
  
  const successfulServices = serviceResults.filter(r => r.success).length;
  const successfulApps = appResults.filter(r => r.success).length;
  
  console.log(`\nServices: ${successfulServices}/${serviceResults.length} completed successfully`);
  console.log(`Apps: ${successfulApps}/${appResults.length} completed successfully`);
  
  // Print failures if any
  const failedServices = serviceResults.filter(r => !r.success);
  const failedApps = appResults.filter(r => !r.success);
  
  if (failedServices.length > 0 || failedApps.length > 0) {
    console.log('\nFailed installations:');
    
    failedServices.forEach(service => {
      console.log(`- Service: ${service.name}`);
    });
    
    failedApps.forEach(app => {
      console.log(`- App: ${app.name}`);
    });
    
    console.log('\nYou may need to install these dependencies manually.');
  }
  
  console.log('\nAll done!');
}

// Run the main function
installAllDependencies().catch(err => {
  console.error('Error installing dependencies:', err);
  process.exit(1);
}); 