import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import net from 'net';

// Configuration - Fix the path to point to the correct root directory
const rootDir = path.resolve(__dirname, '../..');

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
  // Add other services as needed
];

// Sort services by priority
const sortedServices = [...serviceConfig].sort((a, b) => a.priority - b.priority);

// Store child processes to manage them
const serviceProcesses: Record<string, ChildProcess> = {};

/**
 * Check if a service directory exists
 */
function serviceExists(serviceName: string): boolean {
  // Check directly in the services directory
  const servicePath = path.join(rootDir, serviceName);
  
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
 * Start a service
 */
async function startService(service: ServiceConfig): Promise<boolean> {
  if (!serviceExists(service.name)) {
    console.log(`Service ${service.name} directory not found. Skipping.`);
    return false;
  }

  // Check if port is already in use
  const portInUse = await isPortInUse(service.port);
  if (portInUse) {
    console.log(`Port ${service.port} for ${service.name} is already in use. Service might be running already.`);
    return true; // Consider it started
  }

  return new Promise((resolve) => {
    console.log(`Starting ${service.name}...`);
    
    const serviceDir = path.join(rootDir, service.name);
    
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
      }
      delete serviceProcesses[service.name];
    });
    
    // Wait a bit to ensure the service has started
    setTimeout(() => {
      console.log(`${service.name} started successfully.`);
      resolve(true);
    }, 3000);
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
    // Now we're sure priorityGroups[service.priority] exists
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
  
  console.log('All services started successfully.');
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
    }
  });
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

export { serviceProcesses }; 