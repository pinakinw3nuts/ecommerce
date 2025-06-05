#!/usr/bin/env node

/**
 * This script switches services from bcrypt to bcryptjs
 * bcryptjs is a pure JavaScript implementation without native dependencies
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
 * Switch a service from bcrypt to bcryptjs
 */
async function switchToBcryptjs(serviceName) {
  return new Promise((resolve) => {
    const servicePath = serviceName === 'api-gateway' 
      ? apiGatewayDir 
      : path.join(rootDir, 'services', serviceName);
    
    console.log(`Switching ${serviceName} from bcrypt to bcryptjs...`);
    
    // First, install bcryptjs
    const installChild = spawn('npm', ['install', 'bcryptjs', '--save'], {
      cwd: servicePath,
      shell: true,
      stdio: 'inherit',
    });
    
    installChild.on('close', (code) => {
      if (code !== 0) {
        console.error(`Failed to install bcryptjs for ${serviceName}.`);
        resolve(false);
        return;
      }
      
      console.log(`Installed bcryptjs for ${serviceName}.`);
      
      // Now, uninstall bcrypt
      const uninstallChild = spawn('npm', ['uninstall', 'bcrypt'], {
        cwd: servicePath,
        shell: true,
        stdio: 'inherit',
      });
      
      uninstallChild.on('close', (code) => {
        if (code !== 0) {
          console.error(`Failed to uninstall bcrypt from ${serviceName}.`);
          resolve(false);
          return;
        }
        
        console.log(`Uninstalled bcrypt from ${serviceName}.`);
        
        // Now update imports in source files
        updateSourceFiles(servicePath)
          .then(() => {
            console.log(`Successfully switched ${serviceName} to bcryptjs.`);
            resolve(true);
          })
          .catch((err) => {
            console.error(`Error updating source files for ${serviceName}:`, err);
            resolve(false);
          });
      });
    });
  });
}

/**
 * Update source files to use bcryptjs instead of bcrypt
 */
async function updateSourceFiles(servicePath) {
  // Find all TypeScript and JavaScript files
  const findFiles = (dir, fileList = []) => {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && file !== 'node_modules' && file !== 'dist') {
        findFiles(filePath, fileList);
      } else if (
        stat.isFile() && 
        (file.endsWith('.ts') || file.endsWith('.js')) &&
        !file.endsWith('.d.ts')
      ) {
        fileList.push(filePath);
      }
    });
    
    return fileList;
  };
  
  const files = findFiles(path.join(servicePath, 'src'));
  
  // Process each file
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace import statements
    content = content.replace(
      /import\s+\*\s+as\s+bcrypt\s+from\s+['"]bcrypt['"]/g, 
      `import * as bcrypt from 'bcryptjs'`
    );
    
    content = content.replace(
      /import\s+bcrypt\s+from\s+['"]bcrypt['"]/g, 
      `import bcrypt from 'bcryptjs'`
    );
    
    content = content.replace(
      /import\s+{\s*([^}]*)\s*}\s+from\s+['"]bcrypt['"]/g, 
      `import { $1 } from 'bcryptjs'`
    );
    
    content = content.replace(
      /const\s+bcrypt\s*=\s*require\(['"]bcrypt['"]\)/g, 
      `const bcrypt = require('bcryptjs')`
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(file, content, 'utf8');
  }
}

/**
 * Main function
 */
async function main() {
  console.log('\n=======================================================');
  console.log('        SWITCHING SERVICES FROM BCRYPT TO BCRYPTJS');
  console.log('=======================================================\n');
  
  const servicesWithBcrypt = services.filter(serviceUsesBcrypt);
  
  if (servicesWithBcrypt.length === 0) {
    console.log('No services found that use bcrypt.');
    return;
  }
  
  console.log(`Found ${servicesWithBcrypt.length} services using bcrypt: ${servicesWithBcrypt.join(', ')}\n`);
  
  for (const serviceName of servicesWithBcrypt) {
    await switchToBcryptjs(serviceName);
  }
  
  console.log('\n=======================================================');
  console.log('                      ALL DONE');
  console.log('=======================================================\n');
  
  console.log('Benefits of using bcryptjs:');
  console.log('1. Pure JavaScript implementation - no native dependencies');
  console.log('2. Works on all platforms without compilation');
  console.log('3. Compatible API with bcrypt');
  console.log('\n');
}

// Run the main function
main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
}); 