#!/usr/bin/env node

/**
 * This script checks for port conflicts between services and fixes them
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Directory where this script is located
const scriptDir = __dirname;
// API gateway directory
const apiGatewayDir = path.resolve(scriptDir, '..');
// Root directory
const rootDir = path.resolve(apiGatewayDir, '../../');

// Standard service port configuration
const servicePortConfig = {
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
  'wishlist-service': 3013,
  'review-service': 3014,
  'notification-service': 3015,
  'cms-service': 3016,
  'storefront': 3100,
  'admin-panel': 3200,
};

/**
 * Check if a port is in use
 */
function isPortInUse(port) {
  try {
    const command = process.platform === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port} | grep LISTEN`;
    
    const output = execSync(command, { encoding: 'utf8' });
    return output.trim().length > 0;
  } catch (error) {
    // If the command fails, assume the port is not in use
    return false;
  }
}

/**
 * Get the process using a specific port
 */
function getProcessUsingPort(port) {
  try {
    let pid;
    
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const lines = output.split('\n').filter(line => line.includes(`LISTENING`));
      
      if (lines.length > 0) {
        const match = lines[0].match(/\s+(\d+)$/);
        pid = match ? match[1] : null;
      }
    } else {
      const output = execSync(`lsof -i :${port} | grep LISTEN`, { encoding: 'utf8' });
      const lines = output.split('\n').filter(Boolean);
      
      if (lines.length > 0) {
        const match = lines[0].match(/\s+(\d+)\s+/);
        pid = match ? match[1] : null;
      }
    }
    
    if (pid) {
      // Get process name
      let processName;
      
      if (process.platform === 'win32') {
        const tasklistOutput = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, { encoding: 'utf8' });
        const match = tasklistOutput.match(/"([^"]+)"/);
        processName = match ? match[1] : 'Unknown process';
      } else {
        const psOutput = execSync(`ps -p ${pid} -o comm=`, { encoding: 'utf8' });
        processName = psOutput.trim() || 'Unknown process';
      }
      
      return { pid, processName };
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Find and update the port in a service's configuration file
 */
function updateServicePort(serviceName, newPort) {
  const servicePath = path.join(rootDir, 'services', serviceName);
  
  // Check if service directory exists
  if (!fs.existsSync(servicePath)) {
    console.log(`Service directory not found: ${servicePath}`);
    return false;
  }
  
  // Common configuration files to check
  const configFiles = [
    path.join(servicePath, '.env'),
    path.join(servicePath, 'src', 'config', 'index.ts'),
    path.join(servicePath, 'src', 'config', 'config.ts'),
    path.join(servicePath, 'src', 'config.ts'),
    path.join(servicePath, 'src', 'server.ts'),
    path.join(servicePath, 'src', 'index.ts'),
  ];
  
  let updated = false;
  
  for (const configFile of configFiles) {
    if (fs.existsSync(configFile)) {
      try {
        let content = fs.readFileSync(configFile, 'utf8');
        const originalContent = content;
        
        // Different patterns to look for port configuration
        const patterns = [
          { regex: /PORT\s*=\s*(\d+)/g, replacement: `PORT=${newPort}` },
          { regex: /port\s*:\s*(\d+)/g, replacement: `port: ${newPort}` },
          { regex: /PORT\s*:\s*(\d+)/g, replacement: `PORT: ${newPort}` },
          { regex: /const\s+port\s*=\s*(\d+)/g, replacement: `const port = ${newPort}` },
          { regex: /const\s+PORT\s*=\s*(\d+)/g, replacement: `const PORT = ${newPort}` },
          { regex: /process\.env\.PORT\s*\|\|\s*(\d+)/g, replacement: `process.env.PORT || ${newPort}` },
        ];
        
        for (const pattern of patterns) {
          content = content.replace(pattern.regex, pattern.replacement);
        }
        
        if (content !== originalContent) {
          fs.writeFileSync(configFile, content, 'utf8');
          console.log(`Updated port in ${configFile} to ${newPort}`);
          updated = true;
        }
      } catch (error) {
        console.error(`Error updating ${configFile}:`, error.message);
      }
    }
  }
  
  // Also update .env file or create it if it doesn't exist
  const envPath = path.join(servicePath, '.env');
  
  try {
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      
      // Check if PORT is already defined
      if (envContent.match(/^PORT\s*=/m)) {
        // Update existing PORT
        envContent = envContent.replace(/^PORT\s*=.*/m, `PORT=${newPort}`);
      } else {
        // Add PORT at the end
        envContent = envContent.trim() + `\nPORT=${newPort}\n`;
      }
    } else {
      // Create new .env file
      envContent = `PORT=${newPort}\n`;
    }
    
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log(`Updated PORT in ${envPath} to ${newPort}`);
    updated = true;
  } catch (error) {
    console.error(`Error updating ${envPath}:`, error.message);
  }
  
  return updated;
}

/**
 * Find an available port
 */
function findAvailablePort(startPort) {
  let port = startPort;
  
  while (isPortInUse(port)) {
    port++;
  }
  
  return port;
}

/**
 * Main function
 */
async function main() {
  console.log('\n=======================================================');
  console.log('        CHECKING FOR PORT CONFLICTS IN SERVICES');
  console.log('=======================================================\n');
  
  const conflicts = [];
  
  // Check each service port for conflicts
  for (const [serviceName, port] of Object.entries(servicePortConfig)) {
    if (isPortInUse(port)) {
      const processInfo = getProcessUsingPort(port);
      
      conflicts.push({
        serviceName,
        port,
        processInfo,
      });
      
      console.log(`⚠️ Conflict: Port ${port} for ${serviceName} is already in use by ${processInfo ? `${processInfo.processName} (PID: ${processInfo.pid})` : 'an unknown process'}`);
    }
  }
  
  if (conflicts.length === 0) {
    console.log('✅ No port conflicts found.');
    return;
  }
  
  console.log(`\nFound ${conflicts.length} port conflicts. Attempting to resolve...\n`);
  
  // Fix each conflict
  for (const conflict of conflicts) {
    const newPort = findAvailablePort(conflict.port + 1000); // Start looking 1000 ports higher
    
    console.log(`Reassigning ${conflict.serviceName} from port ${conflict.port} to port ${newPort}...`);
    
    if (conflict.serviceName === 'api-gateway') {
      // Update API gateway port in start-services.ts
      const startServicesPath = path.join(apiGatewayDir, 'scripts', 'start-services.ts');
      
      if (fs.existsSync(startServicesPath)) {
        try {
          let content = fs.readFileSync(startServicesPath, 'utf8');
          content = content.replace(/const apiGatewayPort\s*=\s*\d+/g, `const apiGatewayPort = ${newPort}`);
          fs.writeFileSync(startServicesPath, content, 'utf8');
          console.log(`Updated API gateway port in ${startServicesPath} to ${newPort}`);
        } catch (error) {
          console.error(`Error updating ${startServicesPath}:`, error.message);
        }
      }
      
      // Update API gateway port in package.json
      const packageJsonPath = path.join(apiGatewayDir, 'package.json');
      
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          
          if (packageJson.config && packageJson.config.port) {
            packageJson.config.port = newPort;
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
            console.log(`Updated API gateway port in ${packageJsonPath} to ${newPort}`);
          }
        } catch (error) {
          console.error(`Error updating ${packageJsonPath}:`, error.message);
        }
      }
      
      // Update .env file
      const envPath = path.join(apiGatewayDir, '.env');
      
      try {
        let envContent = '';
        
        if (fs.existsSync(envPath)) {
          envContent = fs.readFileSync(envPath, 'utf8');
          
          // Check if PORT is already defined
          if (envContent.match(/^PORT\s*=/m)) {
            // Update existing PORT
            envContent = envContent.replace(/^PORT\s*=.*/m, `PORT=${newPort}`);
          } else {
            // Add PORT at the end
            envContent = envContent.trim() + `\nPORT=${newPort}\n`;
          }
        } else {
          // Create new .env file
          envContent = `PORT=${newPort}\n`;
        }
        
        fs.writeFileSync(envPath, envContent, 'utf8');
        console.log(`Updated PORT in ${envPath} to ${newPort}`);
      } catch (error) {
        console.error(`Error updating ${envPath}:`, error.message);
      }
    } else if (conflict.serviceName === 'storefront' || conflict.serviceName === 'admin-panel') {
      // Update app port
      const appPath = path.join(rootDir, 'apps', conflict.serviceName);
      
      if (fs.existsSync(appPath)) {
        const updated = updateServicePort(path.join('apps', conflict.serviceName), newPort);
        
        if (!updated) {
          console.log(`Could not update port for ${conflict.serviceName}. Please update it manually.`);
        }
      } else {
        console.log(`App directory not found: ${appPath}`);
      }
    } else {
      // Update service port
      const updated = updateServicePort(conflict.serviceName, newPort);
      
      if (!updated) {
        console.log(`Could not update port for ${conflict.serviceName}. Please update it manually.`);
      }
    }
    
    // Also update the port in the service config
    servicePortConfig[conflict.serviceName] = newPort;
  }
  
  console.log('\n=======================================================');
  console.log('                      SUMMARY');
  console.log('=======================================================');
  
  console.log('\nUpdated port configuration:');
  
  for (const [serviceName, port] of Object.entries(servicePortConfig)) {
    const conflict = conflicts.find(c => c.serviceName === serviceName);
    
    if (conflict) {
      console.log(`${serviceName.padEnd(20)} ${conflict.port} -> ${port}`);
    } else {
      console.log(`${serviceName.padEnd(20)} ${port}`);
    }
  }
  
  console.log('\nNext steps:');
  console.log('1. Restart any running services to apply the new port configuration');
  console.log('2. Update any references to these ports in your code');
  console.log('3. Update the API gateway routing configuration if needed');
  console.log('\n');
}

// Run the main function
main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
}); 