/**
 * Order Service Starter Script
 * 
 * This script helps start the Order Service for local testing.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Define color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Service paths
const serviceDir = path.resolve(__dirname, '../../services');
const orderServiceDir = path.join(serviceDir, 'order-service');

// Function to check if the Order Service has a .env file
function checkOrderServiceEnv() {
  const envPath = path.join(orderServiceDir, '.env');
  const envExamplePath = path.join(orderServiceDir, '.env.example');
  
  if (!fs.existsSync(envPath)) {
    console.log(`${colors.yellow}⚠️  Order Service .env file not found!${colors.reset}`);
    
    if (fs.existsSync(envExamplePath)) {
      console.log(`${colors.yellow}ℹ️  An .env.example file exists. Please create a .env file from it.${colors.reset}`);
      console.log(`${colors.dim}   cp ${envExamplePath} ${envPath}${colors.reset}`);
      console.log(`${colors.dim}   Then update any necessary values.${colors.reset}`);
    } else {
      console.log(`${colors.yellow}ℹ️  No .env.example file found. Please create a .env file manually.${colors.reset}`);
    }
    
    return false;
  }
  
  return true;
}

// Function to start the Order Service
function startOrderService() {
  console.log(`${colors.green}🚀 Starting Order Service...${colors.reset}`);
  
  // Check if package.json exists in the Order Service directory
  const packageJsonPath = path.join(orderServiceDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`${colors.red}❌ Order Service package.json not found at: ${packageJsonPath}${colors.reset}`);
    console.log(`${colors.yellow}ℹ️ Make sure the Order Service is correctly installed.${colors.reset}`);
    return;
  }
  
  // Check for node_modules directory in the Order Service directory
  const nodeModulesPath = path.join(orderServiceDir, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    console.log(`${colors.yellow}📦 Installing dependencies for Order Service...${colors.reset}`);
    
    const npmInstall = spawn('npm', ['install'], {
      cwd: orderServiceDir,
      shell: true,
      stdio: 'inherit'
    });
    
    npmInstall.on('close', code => {
      if (code === 0) {
        console.log(`${colors.green}✅ Dependencies installed successfully.${colors.reset}`);
        startOrderServiceProcess();
      } else {
        console.log(`${colors.red}❌ Failed to install dependencies. Exit code: ${code}${colors.reset}`);
      }
    });
  } else {
    startOrderServiceProcess();
  }
}

// Function to start the Order Service process
function startOrderServiceProcess() {
  // Read package.json to determine start command
  const packageJsonPath = path.join(orderServiceDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  let startCommand = 'node src/index.js';
  
  if (packageJson.scripts && packageJson.scripts.start) {
    startCommand = 'npm run start';
  } else if (packageJson.scripts && packageJson.scripts.dev) {
    startCommand = 'npm run dev';
  }
  
  console.log(`${colors.cyan}ℹ️  Starting Order Service with: ${startCommand}${colors.reset}`);
  
  // Split command into program and args
  const [program, ...args] = startCommand.split(' ');
  
  // Start the service
  const orderService = spawn(program, args, {
    cwd: orderServiceDir,
    shell: true,
    stdio: 'pipe'
  });
  
  // Handle output
  orderService.stdout.on('data', data => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${colors.cyan}[Order Service] ${colors.reset}${line}`);
      }
    });
  });
  
  orderService.stderr.on('data', data => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${colors.red}[Order Service ERR] ${colors.reset}${line}`);
      }
    });
  });
  
  orderService.on('close', code => {
    if (code !== 0) {
      console.log(`${colors.red}❌ Order Service process exited with code ${code}${colors.reset}`);
    } else {
      console.log(`${colors.green}✅ Order Service process exited successfully.${colors.reset}`);
    }
  });
  
  // Handle user input to stop the service
  console.log(`${colors.yellow}ℹ️  Press Ctrl+C to stop the Order Service${colors.reset}`);
  
  process.on('SIGINT', () => {
    console.log(`${colors.yellow}⏹️  Stopping Order Service...${colors.reset}`);
    orderService.kill();
    process.exit(0);
  });
}

// Main function
function main() {
  console.log(`${colors.bright}${colors.green}==============================================${colors.reset}`);
  console.log(`${colors.bright}${colors.green}       Order Service Starter Script         ${colors.reset}`);
  console.log(`${colors.bright}${colors.green}==============================================${colors.reset}`);
  
  // Check if the Order Service directory exists
  if (!fs.existsSync(orderServiceDir)) {
    console.log(`${colors.red}❌ Order Service directory not found at: ${orderServiceDir}${colors.reset}`);
    return;
  }
  
  // Check if the Order Service has a .env file
  const hasEnvFile = checkOrderServiceEnv();
  
  if (!hasEnvFile) {
    console.log(`${colors.yellow}⚠️  Missing .env file. Create one before starting the service.${colors.reset}`);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(`${colors.yellow}Do you want to continue anyway? (y/N): ${colors.reset}`, answer => {
      rl.close();
      if (answer.toLowerCase() === 'y') {
        startOrderService();
      } else {
        console.log(`${colors.red}❌ Aborted. Please set up the .env file and try again.${colors.reset}`);
      }
    });
  } else {
    startOrderService();
  }
}

main(); 