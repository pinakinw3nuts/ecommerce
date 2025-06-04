#!/usr/bin/env node

/**
 * This script checks if the API gateway is already running
 */

const http = require('http');
const { execSync } = require('child_process');
const os = require('os');

// Default port
const port = process.env.PORT || 3000;

console.log(`\n🔍 Checking if API Gateway is running on port ${port}...`);

// Check if a process is listening on the port
function checkPort() {
  return new Promise((resolve) => {
    const req = http.get({
      hostname: 'localhost',
      port,
      path: '/health',
      timeout: 1000,
    }, (res) => {
      if (res.statusCode === 200) {
        console.log(`✅ API Gateway is running on port ${port}`);
        
        // Try to get more information
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const info = JSON.parse(data);
            console.log('\nAPI Gateway Info:');
            console.log(`- Status: ${info.status}`);
            console.log(`- Environment: ${info.env}`);
            console.log(`- Version: ${info.version}`);
            console.log(`- Uptime: ${info.uptime} seconds`);
          } catch (e) {
            // Ignore parsing errors
          }
          resolve(true);
        });
      } else {
        console.log(`⚠️ Something is running on port ${port}, but it might not be the API Gateway (status code: ${res.statusCode})`);
        resolve(true);
      }
    });
    
    req.on('error', () => {
      console.log(`❌ API Gateway is not running on port ${port}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log(`❌ API Gateway health check timed out on port ${port}`);
      resolve(false);
    });
  });
}

// Find processes using the port
function findProcessUsingPort() {
  try {
    let command;
    if (os.platform() === 'win32') {
      command = `netstat -ano | findstr :${port}`;
    } else {
      command = `lsof -i :${port} -P -n`;
    }
    
    console.log(`\nRunning command: ${command}`);
    const result = execSync(command, { encoding: 'utf-8' });
    
    if (result) {
      console.log('\nProcesses using port', port, ':');
      console.log(result);
      
      // Try to get more detailed process information on Windows
      if (os.platform() === 'win32') {
        // Extract PIDs from netstat output
        const pidRegex = /\s+(\d+)$/gm;
        const pids = new Set();
        let match;
        
        while ((match = pidRegex.exec(result)) !== null) {
          pids.add(match[1]);
        }
        
        if (pids.size > 0) {
          console.log('\nProcess details:');
          pids.forEach(pid => {
            try {
              const processInfo = execSync(`tasklist /FI "PID eq ${pid}" /FO TABLE`, { encoding: 'utf-8' });
              console.log(processInfo);
            } catch (e) {
              console.log(`Could not get details for PID ${pid}`);
            }
          });
        }
        
        console.log('\nTo kill the process:');
        console.log(`1. Find the PID (last column) in the output above`);
        console.log(`2. Run: taskkill /F /PID <pid>`);
        console.log(`   Example: taskkill /F /PID 1234`);
      } else {
        console.log('\nTo kill the process:');
        console.log(`1. Find the PID (second column) in the output above`);
        console.log(`2. Run: kill -9 <pid>`);
      }
    } else {
      console.log('No process found using port', port);
    }
  } catch (error) {
    if (error.status === 1) {
      console.log(`No process found using port ${port}`);
    } else {
      console.error('Error finding process:', error.message);
    }
  }
}

// Main function
async function main() {
  const isRunning = await checkPort();
  
  if (isRunning) {
    console.log('\nIf you want to start another instance of the API Gateway, you need to:');
    console.log('1. Stop the current instance, or');
    console.log('2. Use a different port (set PORT environment variable)');
  } else {
    findProcessUsingPort();
  }
}

// Run the main function
main().catch(console.error); 