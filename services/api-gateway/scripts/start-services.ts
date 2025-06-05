import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import net from 'net';

// Configuration - Fix the path to point to the correct root directory
const rootDir = path.resolve(__dirname, '../../..');

interface ServiceConfig {
  name: string;
  priority: number;
  port: number;
  command: string;
}

const serviceConfig: ServiceConfig[] = [
  {
    name: 'auth-service',
    priority: 1, // Higher priority services start first
    port: 3001,
    command: 'dev',
  },
  {
    name: 'user-service',
    priority: 2,
    port: 3002,
    command: 'dev',
  },
  {
    name: 'product-service',
    priority: 3,
    port: 3003,
    command: 'dev',
  },
  {
    name: 'cart-service',
    priority: 3,
    port: 3004,
    command: 'dev',
  },
  {
    name: 'checkout-service',
    priority: 4,
    port: 3005,
    command: 'dev',
  },
  {
    name: 'order-service',
    priority: 4,
    port: 3006,
    command: 'dev',
  },
  {
    name: 'payment-service',
    priority: 5,
    port: 3007,
    command: 'dev',
  },
  {
    name: 'shipping-service',
    priority: 5,
    port: 3008,
    command: 'dev',
  },
  {
    name: 'inventory-service',
    priority: 6,
    port: 3009,
    command: 'dev',
  },
  {
    name: 'company-service',
    priority: 6,
    port: 3010,
    command: 'dev',
  },
  {
    name: 'pricing-service',
    priority: 7,
    port: 3011,
    command: 'dev',
  },
  {
    name: 'admin-service',
    priority: 7,
    port: 3012,
    command: 'dev',
  },
  {
    name: 'wishlist-service',
    priority: 8,
    port: 3013,
    command: 'dev',
  },
  {
    name: 'review-service',
    priority: 8,
    port: 3014,
    command: 'dev',
  },
  {
    name: 'notification-service',
    priority: 9,
    port: 3015,
    command: 'dev',
  },
  {
    name: 'cms-service',
    priority: 9,
    port: 3016,
    command: 'dev',
  },
];

// Sort services by priority
const sortedServices = [...serviceConfig].sort((a, b) => a.priority - b.priority);

// Store child processes to manage them
const serviceProcesses: Record<string, ChildProcess> = {};
// Track service status
const serviceStatus: Record<string, 'starting' | 'running' | 'failed' | 'not-found'> = {};

/**
 * Check if a service directory exists
 */
function serviceExists(serviceName: string): boolean {
  // Check in the services directory
  const servicePath = path.join(rootDir, 'services', serviceName);
  
  // Log the path we're checking for debugging
  console.log(`Checking for service at: ${servicePath}`);
  
  return fs.existsSync(servicePath);
}

/**
 * Check if a port is in use
 */
async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port);
  });
}

/**
 * Verify if service is running by making a TCP connection
 */
async function isServiceResponding(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    // Simple TCP connection test to check if port is in use
    const socket = net.createConnection(port, 'localhost');
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(false); // Timeout - assume service is not running
    }, 1000);
    
    socket.on('connect', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(true); // Connection successful - service is running
    });
    
    socket.on('error', () => {
      clearTimeout(timeout);
      resolve(false); // Connection error - service is not running
    });
  });
}

/**
 * Start a service
 */
async function startService(service: ServiceConfig): Promise<boolean> {
  if (!serviceExists(service.name)) {
    console.log(`Service ${service.name} directory not found. Skipping.`);
    serviceStatus[service.name] = 'not-found';
    return false;
  }

  // Check if port is already in use
  const portInUse = await isPortInUse(service.port);
  if (portInUse) {
    // Verify if it's our service responding on this port or something else
    const isServiceRunning = await isServiceResponding(service.port);
    if (isServiceRunning) {
      console.log(`Service ${service.name} is already running on port ${service.port}.`);
      serviceStatus[service.name] = 'running';
      return true;
    } else {
      console.log(`Port ${service.port} for ${service.name} is in use by another process. Can't start service.`);
      serviceStatus[service.name] = 'failed';
      return false;
    }
  }

  return new Promise((resolve) => {
    console.log(`Starting ${service.name}...`);
    serviceStatus[service.name] = 'starting';
    
    const serviceDir = path.join(rootDir, 'services', service.name);
    
    // Check if package.json exists in the service directory
    if (!fs.existsSync(path.join(serviceDir, 'package.json'))) {
      console.log(`No package.json found for ${service.name}. Skipping.`);
      serviceStatus[service.name] = 'failed';
      resolve(false);
      return;
    }

    // Use pnpm to start the service
    const child = spawn('pnpm', ['run', service.command], {
      cwd: serviceDir,
      shell: true,
      stdio: 'pipe', // Capture output
    });
    
    // Store the process
    serviceProcesses[service.name] = child;
    
    // Handle stdout
    child.stdout?.on('data', (data) => {
      console.log(`[${service.name}] ${data.toString().trim()}`);
    });
    
    // Handle stderr
    child.stderr?.on('data', (data) => {
      console.error(`[${service.name}] ERROR: ${data.toString().trim()}`);
    });
    
    // Handle process exit
    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`${service.name} process exited with code ${code}`);
        serviceStatus[service.name] = 'failed';
      } else {
        serviceStatus[service.name] = 'running';
      }
      delete serviceProcesses[service.name];
    });
    
    // Wait to check if the service started properly
    setTimeout(async () => {
      // Update status based on whether port is in use and service is responding
      const isPortActive = await isPortInUse(service.port);
      if (isPortActive) {
        const isResponding = await isServiceResponding(service.port);
        if (isResponding) {
          serviceStatus[service.name] = 'running';
          console.log(`${service.name} started successfully.`);
          resolve(true);
        } else {
          // Port is in use but service doesn't respond to health checks
          // May still be a valid service but without a health endpoint
          serviceStatus[service.name] = 'running';
          console.log(`${service.name} started, but health check failed. Check if service is configured properly.`);
          resolve(true);
        }
      } else {
        serviceStatus[service.name] = 'failed';
        console.error(`${service.name} failed to start.`);
        resolve(false);
      }
    }, 5000);
  });
}

/**
 * Start all services
 */
export async function startAllServices(): Promise<void> {
  console.log('Starting all microservices...');
  
  // Group services by priority and start them in sequence
  const priorityGroups: Record<number, ServiceConfig[]> = {};
  
  sortedServices.forEach(service => {
    if (!priorityGroups[service.priority]) {
      priorityGroups[service.priority] = [];
    }
    priorityGroups[service.priority]!.push(service);
  });
  
  // Start services by priority groups
  for (const priority of Object.keys(priorityGroups).sort()) {
    const priorityNum = Number(priority);
    const services = priorityGroups[priorityNum];
    
    if (!services) continue; // Skip if somehow undefined
    
    console.log(`Starting priority ${priority} services: ${services.map(s => s.name).join(', ')}`);
    
    // Start all services in this priority group
    await Promise.all(services.map(service => startService(service)));
  }
  
  // Print a summary of services started
  console.log('\nService start summary:');
  console.log('--------------------');
  for (const service of sortedServices) {
    const status = serviceStatus[service.name] || 'unknown';
    const statusDisplay = {
      'running': '✅ RUNNING',
      'starting': '⏳ STARTING',
      'failed': '❌ FAILED',
      'not-found': '⚠️ NOT FOUND',
      'unknown': '❓ UNKNOWN',
    }[status];
    
    console.log(`${service.name.padEnd(20)} - ${statusDisplay}`);
  }
  
  console.log('\nServices startup complete. Check individual service logs for more details.');
}

/**
 * Stop all services
 */
export function stopAllServices(): void {
  console.log('Stopping all services...');
  
  Object.keys(serviceProcesses).forEach(serviceName => {
    const process = serviceProcesses[serviceName];
    if (process) {
      console.log(`Stopping ${serviceName}...`);
      process.kill();
      serviceStatus[serviceName] = 'failed'; // Mark as no longer running
    }
  });
}

/**
 * Get the current status of all services
 */
export function getServiceStatus(): Record<string, 'starting' | 'running' | 'failed' | 'not-found'> {
  return { ...serviceStatus };
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down all services...');
  stopAllServices();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down all services...');
  stopAllServices();
  process.exit(0);
});

// If this script is run directly, start all services
if (require.main === module) {
  startAllServices().catch(err => {
    console.error('Failed to start services:', err);
    process.exit(1);
  });
}

export { serviceProcesses, serviceConfig }; 