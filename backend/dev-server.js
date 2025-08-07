const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Development Server with TypeScript Bypass...\n');

// Use ts-node with transpile-only to bypass TypeScript errors
const serverProcess = spawn('npx', [
  'ts-node',
  '--transpile-only',
  '--skip-project',
  '--no-cache',
  path.join(__dirname, 'src/server.ts')
], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'development',
    TS_NODE_TRANSPILE_ONLY: 'true',
    TS_NODE_SKIP_PROJECT: 'true'
  }
});

serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code}`);
    process.exit(code);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill('SIGTERM');
}); 