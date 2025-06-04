#!/usr/bin/env node

/**
 * This script starts the API gateway without Redis
 * It's useful for development environments where Redis is not available
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Directory where this script is located
const scriptDir = __dirname;
// API gateway directory
const apiGatewayDir = path.resolve(scriptDir, '..');

console.log('Starting API Gateway without Redis...');

// Set environment variables to disable Redis
const env = {
  ...process.env,
  REDIS_URL: '', // Empty string to disable Redis
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