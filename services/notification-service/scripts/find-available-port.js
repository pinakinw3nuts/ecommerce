/**
 * Script to find an available port and export it to the environment
 * This script will check a range of ports and set the first available one as the PORT environment variable
 */
const net = require('net');
const { execSync } = require('child_process');

// List of ports to try, in order of preference
const portsToTry = [3014, 3030, 3031, 3032, 3033, 3034, 3035, 3036, 3037, 3038, 3039, 5000, 8080, 8081, 8090];

/**
 * Check if a port is available
 * @param {number} port - The port to check
 * @returns {Promise<boolean>} - True if the port is available, false otherwise
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      // If we get an error, the port is in use
      resolve(false);
    });
    
    server.once('listening', () => {
      // If we're listening, the port is available
      // Close the server and report the port as available
      server.close(() => {
        resolve(true);
      });
    });
    
    // Try to listen on the port
    server.listen(port, '127.0.0.1');
  });
}

/**
 * Find the first available port in the list
 * @returns {Promise<number|null>} - The first available port, or null if none are available
 */
async function findAvailablePort() {
  for (const port of portsToTry) {
    console.log(`Checking if port ${port} is available...`);
    
    if (await isPortAvailable(port)) {
      console.log(`Port ${port} is available!`);
      return port;
    } else {
      console.log(`Port ${port} is in use, trying next...`);
    }
  }
  
  // If we get here, none of our preferred ports are available
  // Let the system assign a random port (0)
  console.log('No specific ports available, will use random port');
  return 0;
}

// Main function
async function main() {
  try {
    const port = await findAvailablePort();
    
    if (port === 0) {
      console.log('Setting PORT=0 (random port) in environment');
    } else {
      console.log(`Setting PORT=${port} in environment`);
    }
    
    // Set the environment variable
    process.env.PORT = port.toString();
    
    // Output in a format that can be used with cross-env
    console.log(`PORT=${port}`);
    
    // For Windows CMD
    console.log(`::set-env name=PORT::${port}`);
    
    // For PowerShell
    console.log(`$env:PORT=${port}`);
    
    // Exit with success
    process.exit(0);
  } catch (error) {
    console.error('Error finding available port:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 