#!/usr/bin/env node

/**
 * This script rebuilds the bcrypt module for all services
 * to ensure native dependencies are correctly compiled for the current platform
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

// Services to check for bcrypt
const services = [
  'api-gateway',
  'auth-service',
  'user-service',
  'admin-service',
];

/**
 * Check if a service uses bcrypt
 */
function serviceUsesBcrypt(serviceName) {
  try {
    const servicePath = serviceName === 'api-gateway' 
      ? apiGatewayDir 
      : path.join(rootDir, 'services', serviceName);
    
    const packageJsonPath = path.join(servicePath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return false;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check if bcrypt is in dependencies or devDependencies
    return (
      (packageJson.dependencies && packageJson.dependencies.bcrypt) ||
      (packageJson.devDependencies && packageJson.devDependencies.bcrypt)
    );
  } catch (error) {
    console.error(`Error checking if ${serviceName} uses bcrypt:`, error.message);
    return false;
  }
}

/**
 * Rebuild bcrypt for a service
 */
async function rebuildBcrypt(serviceName) {
  return new Promise((resolve) => {
    const servicePath = serviceName === 'api-gateway' 
      ? apiGatewayDir 
      : path.join(rootDir, 'services', serviceName);
    
    console.log(`Rebuilding bcrypt for ${serviceName}...`);
    
    // Run npm rebuild bcrypt --build-from-source
    const child = spawn('npm', ['rebuild', 'bcrypt', '--build-from-source'], {
      cwd: servicePath,
      shell: true,
      stdio: 'inherit',
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`Failed to rebuild bcrypt for ${serviceName}.`);
        resolve(false);
      } else {
        console.log(`Successfully rebuilt bcrypt for ${serviceName}.`);
        resolve(true);
      }
    });
    
    child.on('error', (err) => {
      console.error(`Error rebuilding bcrypt for ${serviceName}:`, err);
      resolve(false);
    });
  });
}

/**
 * Main function
 */
async function main() {
  console.log('\n=======================================================');
  console.log('           REBUILDING BCRYPT FOR ALL SERVICES');
  console.log('=======================================================\n');
  
  const servicesWithBcrypt = services.filter(serviceUsesBcrypt);
  
  if (servicesWithBcrypt.length === 0) {
    console.log('No services found that use bcrypt.');
    return;
  }
  
  console.log(`Found ${servicesWithBcrypt.length} services using bcrypt: ${servicesWithBcrypt.join(', ')}\n`);
  
  for (const serviceName of servicesWithBcrypt) {
    await rebuildBcrypt(serviceName);
  }
  
  console.log('\n=======================================================');
  console.log('                      ALL DONE');
  console.log('=======================================================\n');
  
  console.log('If you continue to have issues with bcrypt, try these steps:');
  console.log('1. Make sure you have the necessary build tools installed:');
  console.log('   - Windows: npm install --global --production windows-build-tools');
  console.log('   - macOS: xcode-select --install');
  console.log('   - Linux: apt-get install build-essential python');
  console.log('2. Try installing a prebuilt binary: npm install bcrypt --no-build-from-source');
  console.log('3. Consider using a pure JS alternative like bcryptjs');
  console.log('\n');
}

// Run the main function
main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
}); 