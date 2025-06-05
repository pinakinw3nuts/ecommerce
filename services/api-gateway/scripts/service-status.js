#!/usr/bin/env node

/**
 * This script provides a comprehensive status overview of all services
 * in the e-commerce microservices platform.
 * 
 * Usage:
 *   node scripts/service-status.js
 */

const { checkServices } = require('./check-services');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Directory where this script is located
const scriptDir = __dirname;
// API gateway directory
const apiGatewayDir = path.resolve(scriptDir, '..');
// Root directory
const rootDir = path.resolve(apiGatewayDir, '../..');

/**
 * Get the process memory usage for a PID
 */
function getProcessMemory(pid) {
  try {
    if (!pid || pid === 'Unknown') return 'Unknown';

    // Different commands for Windows and Unix-like systems
    let command;
    if (process.platform === 'win32') {
      command = `powershell "Get-Process -Id ${pid} | Select-Object -ExpandProperty WorkingSet64"`;
    } else {
      command = `ps -o rss= -p ${pid}`;
    }

    const output = execSync(command, { encoding: 'utf8' }).trim();
    
    // Convert to MB
    const memoryMB = process.platform === 'win32' 
      ? Math.round(parseInt(output) / (1024 * 1024))
      : Math.round(parseInt(output) / 1024);
    
    return `${memoryMB} MB`;
  } catch (error) {
    return 'Unknown';
  }
}

/**
 * Get the CPU usage for a PID
 */
function getProcessCPU(pid) {
  try {
    if (!pid || pid === 'Unknown') return 'Unknown';

    // Different commands for Windows and Unix-like systems
    let command;
    if (process.platform === 'win32') {
      command = `powershell "Get-Process -Id ${pid} | Select-Object -ExpandProperty CPU"`;
    } else {
      command = `ps -o %cpu= -p ${pid}`;
    }

    const output = execSync(command, { encoding: 'utf8' }).trim();
    return `${parseFloat(output).toFixed(1)}%`;
  } catch (error) {
    return 'Unknown';
  }
}

/**
 * Get uptime of a process
 */
function getProcessUptime(pid) {
  try {
    if (!pid || pid === 'Unknown') return 'Unknown';

    let startTime;
    if (process.platform === 'win32') {
      const command = `powershell "Get-Process -Id ${pid} | Select-Object -ExpandProperty StartTime"`;
      const output = execSync(command, { encoding: 'utf8' }).trim();
      startTime = new Date(output);
    } else {
      // Unix-like systems
      const command = `ps -o lstart= -p ${pid}`;
      const output = execSync(command, { encoding: 'utf8' }).trim();
      startTime = new Date(output);
    }

    const uptime = Date.now() - startTime;
    const seconds = Math.floor(uptime / 1000);
    
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    } else if (seconds < 86400) {
      return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    } else {
      return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
    }
  } catch (error) {
    return 'Unknown';
  }
}

/**
 * Get process info for a port with detailed metrics
 */
function getDetailedProcessInfo(port) {
  try {
    // Using netstat to find the process using the port
    let command;
    let output;
    
    if (process.platform === 'win32') {
      // On Windows, use a more reliable command that shows all TCP connections
      command = `netstat -ano | findstr :${port}`;
      output = execSync(command, { encoding: 'utf8' });
      
      // Parse the output to find the PID
      const lines = output.split('\n').filter(line => 
        line.includes(`LISTENING`) || // Look for LISTENING state
        line.includes(`ESTABLISHED`) || // Also check for ESTABLISHED connections
        line.includes(`:${port} `) // Or just the port with a space after it
      );
      
      if (lines.length > 0) {
        // Extract PID from the last column
        const pidMatch = lines[0].trim().match(/\s+(\d+)$/);
        const pid = pidMatch ? pidMatch[1] : 'Unknown';
        
        if (pid && pid !== 'Unknown') {
          const memory = getProcessMemory(pid);
          const cpu = getProcessCPU(pid);
          const uptime = getProcessUptime(pid);
          
          return {
            pid,
            memory,
            cpu,
            uptime
          };
        }
        
        return { pid: pid || 'Unknown' };
      }
    } else {
      // Unix-like systems
      command = `lsof -i :${port} | grep LISTEN`;
      output = execSync(command, { encoding: 'utf8' });
      const lines = output.split('\n').filter(Boolean);
      
      if (lines.length > 0) {
        // Extract PID from the output
        const match = lines[0].match(/\s+(\d+)\s+/);
        const pid = match ? match[1] : 'Unknown';
        
        if (pid && pid !== 'Unknown') {
          const memory = getProcessMemory(pid);
          const cpu = getProcessCPU(pid);
          const uptime = getProcessUptime(pid);
          
          return {
            pid,
            memory,
            cpu,
            uptime
          };
        }
        
        return { pid: pid || 'Unknown' };
      }
    }
    
    // Try an alternative approach if the above didn't work
    if (process.platform === 'win32') {
      // Use PowerShell to get more detailed information
      try {
        command = `powershell -Command "Get-NetTCPConnection -LocalPort ${port} | Select-Object OwningProcess | Format-Table -HideTableHeaders"`;
        output = execSync(command, { encoding: 'utf8' }).trim();
        
        if (output && !isNaN(parseInt(output))) {
          const pid = output.trim();
          const memory = getProcessMemory(pid);
          const cpu = getProcessCPU(pid);
          const uptime = getProcessUptime(pid);
          
          return {
            pid,
            memory,
            cpu,
            uptime
          };
        }
      } catch (err) {
        // PowerShell command failed, continue with default return
      }
    }
    
    return { pid: 'N/A' };
  } catch (error) {
    return { pid: 'N/A' };
  }
}

/**
 * Check if a service's package.json exists and has the necessary scripts
 */
function checkServicePackageJson(serviceName) {
  try {
    const servicePath = path.join(rootDir, 'services', serviceName);
    const packageJsonPath = path.join(servicePath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return { 
        exists: false, 
        hasDevScript: false,
        error: 'Missing package.json'
      };
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const hasDevScript = packageJson.scripts && packageJson.scripts.dev;
    
    return { 
      exists: true, 
      hasDevScript,
      error: hasDevScript ? null : 'Missing dev script in package.json'
    };
  } catch (error) {
    return { 
      exists: false, 
      hasDevScript: false,
      error: `Error reading package.json: ${error.message}`
    };
  }
}

/**
 * Check if a service has all its dependencies installed
 */
function checkServiceDependencies(serviceName) {
  try {
    const servicePath = path.join(rootDir, 'services', serviceName);
    const nodeModulesPath = path.join(servicePath, 'node_modules');
    
    return fs.existsSync(nodeModulesPath);
  } catch (error) {
    return false;
  }
}

/**
 * Get diagnostic information for a service
 */
function getDiagnosticInfo(serviceName) {
  const packageJsonInfo = checkServicePackageJson(serviceName);
  const hasDependencies = checkServiceDependencies(serviceName);
  
  const issues = [];
  
  if (!packageJsonInfo.exists) {
    issues.push(packageJsonInfo.error);
  } else if (!packageJsonInfo.hasDevScript) {
    issues.push(packageJsonInfo.error);
  }
  
  if (!hasDependencies) {
    issues.push('Missing node_modules (dependencies not installed)');
  }
  
  return {
    packageJson: packageJsonInfo,
    dependencies: hasDependencies,
    issues: issues
  };
}

/**
 * Display enhanced service status with detailed metrics
 */
async function displayEnhancedStatus() {
  console.log('\n=======================================================================');
  console.log('               MICROSERVICES PLATFORM - STATUS OVERVIEW');
  console.log('=======================================================================');
  
  // Get basic service status
  const statusResults = await checkServices();
  
  // Override the isRunning property based on port availability
  // This is more reliable than HTTP health endpoint checks
  for (const service of statusResults.services) {
    // If the service is showing as not running, double-check with a direct port check
    if (!service.isRunning) {
      service.isRunning = await isPortActive(service.port);
    }
  }
  
  for (const app of statusResults.apps) {
    // If the app is showing as not running, double-check with a direct port check
    if (!app.isRunning) {
      app.isRunning = await isPortActive(app.port);
    }
  }
  
  // Categorize services
  const runningServices = statusResults.services.filter(s => s.isRunning);
  const stoppedServices = statusResults.services.filter(s => !s.isRunning && s.exists);
  const notFoundServices = statusResults.services.filter(s => !s.exists);
  
  const runningApps = statusResults.apps.filter(a => a.isRunning);
  const stoppedApps = statusResults.apps.filter(a => !a.isRunning && a.exists);
  const notFoundApps = statusResults.apps.filter(a => !a.exists);
  
  // Display running services with detailed metrics
  if (runningServices.length > 0) {
    console.log('\n[ RUNNING SERVICES ]');
    console.log('Service'.padEnd(25), 'Port'.padEnd(10), 'PID'.padEnd(10), 'CPU'.padEnd(10), 'Memory'.padEnd(10), 'Uptime');
    console.log('-----------------------------------------------------------------------');
    
    for (const service of runningServices) {
      const processInfo = getDetailedProcessInfo(service.port);
      console.log(
        service.name.padEnd(25),
        String(service.port).padEnd(10),
        String(processInfo.pid || 'N/A').padEnd(10),
        String(processInfo.cpu || 'N/A').padEnd(10),
        String(processInfo.memory || 'N/A').padEnd(10),
        processInfo.uptime || 'N/A'
      );
    }
  }
  
  // Display stopped services with diagnostics
  if (stoppedServices.length > 0) {
    console.log('\n[ STOPPED SERVICES ]');
    console.log('Service'.padEnd(25), 'Port'.padEnd(10), 'Status'.padEnd(15), 'Possible Issues');
    console.log('-----------------------------------------------------------------------');
    
    for (const service of stoppedServices) {
      const diagnostics = getDiagnosticInfo(service.name);
      const issuesText = diagnostics.issues.length > 0 
        ? diagnostics.issues.join(', ') 
        : 'Ready to start';
      
      console.log(
        service.name.padEnd(25),
        String(service.port).padEnd(10),
        'NOT RUNNING'.padEnd(15),
        issuesText
      );
    }
  }
  
  // Display running apps
  if (runningApps.length > 0) {
    console.log('\n[ RUNNING APPS ]');
    console.log('App'.padEnd(25), 'Port'.padEnd(10), 'PID'.padEnd(10), 'CPU'.padEnd(10), 'Memory'.padEnd(10), 'Uptime');
    console.log('-----------------------------------------------------------------------');
    
    for (const app of runningApps) {
      const processInfo = getDetailedProcessInfo(app.port);
      console.log(
        app.name.padEnd(25),
        String(app.port).padEnd(10),
        String(processInfo.pid || 'N/A').padEnd(10),
        String(processInfo.cpu || 'N/A').padEnd(10),
        String(processInfo.memory || 'N/A').padEnd(10),
        processInfo.uptime || 'N/A'
      );
    }
  }
  
  // Display stopped apps
  if (stoppedApps.length > 0) {
    console.log('\n[ STOPPED APPS ]');
    console.log('App'.padEnd(25), 'Port'.padEnd(10), 'Status');
    console.log('-----------------------------------------------------------------------');
    
    for (const app of stoppedApps) {
      console.log(
        app.name.padEnd(25),
        String(app.port).padEnd(10),
        'NOT RUNNING'
      );
    }
  }
  
  // Summary
  console.log('\n=======================================================================');
  console.log(`SUMMARY: ${runningServices.length}/${statusResults.services.filter(s => s.exists).length} services running | ${runningApps.length}/${statusResults.apps.filter(a => a.exists).length} apps running`);
  
  // Provide troubleshooting tips if no services are running
  if (runningServices.length === 0 && stoppedServices.length > 0) {
    console.log('\nTROUBLESHOOTING TIPS:');
    console.log('1. Make sure all dependencies are installed with: pnpm install');
    console.log('2. Check for port conflicts (another process might be using the same port)');
    console.log('3. Look for error messages in the console when starting services');
    console.log('4. Make sure PostgreSQL is running and properly configured');
    console.log('5. To install dependencies for all services: npm run install:deps');
  }
  
  console.log('=======================================================================\n');
}

/**
 * Check if a port is active by attempting a TCP connection
 */
async function isPortActive(port) {
  return new Promise((resolve) => {
    const socket = require('net').createConnection(port, 'localhost');
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

// Run the status display if this script is executed directly
if (require.main === module) {
  displayEnhancedStatus().catch(err => {
    console.error('Error displaying service status:', err);
  });
}

module.exports = {
  displayEnhancedStatus
}; 