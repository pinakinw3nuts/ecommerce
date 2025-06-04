#!/usr/bin/env node

/**
 * This script starts the API gateway on a specified port
 * Usage: node start-on-port.js [port]
 * Default port: 3030
 */

const { spawn } = require('child_process');
const path = require('path');

// Directory where this script is located
const scriptDir = __dirname;
// API gateway directory
const apiGatewayDir = path.resolve(scriptDir, '..');

// Get port from command line arguments or use default
const port = process.argv[2] || 3030;

console.log(`Starting API Gateway on port ${port}...`);

// Set environment variables
const env = {
  ...process.env,
  PORT: port,
  // Disable Redis by default to avoid connection issues
  REDIS_URL: process.env.REDIS_URL || '',
};

// Start the API gateway
const apiGatewayProcess = spawn('pnpm', ['run', 'dev'], {
  cwd: apiGatewayDir,
  env,
  stdio: 'inherit',
  shell: true,
});

// Handle process events
apiGatewayProcess.on('error', (err) => {
  console.error('Failed to start API Gateway:', err);
  process.exit(1);
});

apiGatewayProcess.on('close', (code) => {
  console.log(`API Gateway process exited with code ${code}`);
  process.exit(code || 0);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down...');
  apiGatewayProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down...');
  apiGatewayProcess.kill();
  process.exit(0);
}); 