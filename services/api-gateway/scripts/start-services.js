const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const rootDir = path.resolve(__dirname, '../../');
const serviceConfig = [
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
const serviceProcesses = {};

/**
 * Check if a service directory exists
 */
function serviceExists(serviceName) {
  const servicePath = path.join(rootDir, 'services', serviceName);
  return fs.existsSync(servicePath);
}

/**
 * Check if a port is in use
 */
async function isPortInUse(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.once('error', (err) => {
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
async function startService(service) {
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
    
    const serviceDir = path.join(rootDir, 'services', service.name);
    
    // Use pnpm to start the service
    const child = spawn('pnpm', ['run', service.command], {
      cwd: serviceDir,
      shell: true,
      stdio: 'pipe', // Capture output
    });
    
    // Store the process
    serviceProcesses[service.name] = child;
    
    // Handle stdout
    child.stdout.on('data', (data) => {
      console.log(`[${service.name}] ${data.toString().trim()}`);
    });
    
    // Handle stderr
    child.stderr.on('data', (data) => {
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
async function startAllServices() {
  console.log('Starting all microservices...');
  
  // Group services by priority and start them in sequence
  const priorityGroups = {};
  
  sortedServices.forEach(service => {
    if (!priorityGroups[service.priority]) {
      priorityGroups[service.priority] = [];
    }
    priorityGroups[service.priority].push(service);
  });
  
  // Start services by priority groups
  for (const priority of Object.keys(priorityGroups).sort()) {
    const services = priorityGroups[priority];
    console.log(`Starting priority ${priority} services: ${services.map(s => s.name).join(', ')}`);
    
    // Start all services in this priority group
    await Promise.all(services.map(service => startService(service)));
  }
  
  console.log('All services started successfully.');
}

/**
 * Stop all services
 */
function stopAllServices() {
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

// Export functions for use in other files
module.exports = {
  startAllServices,
  stopAllServices,
  serviceProcesses
};

// If this script is run directly, start all services
if (require.main === module) {
  startAllServices().catch(err => {
    console.error('Failed to start services:', err);
    process.exit(1);
  });
} 