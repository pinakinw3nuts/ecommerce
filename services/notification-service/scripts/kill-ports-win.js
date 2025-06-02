/**
 * Windows-specific script to kill processes on ports
 */
const { exec } = require('child_process');

const portsToKill = [3014, 3030, 3031, 3032, 3033, 3034, 3035, 3036, 3037, 3038, 3039];

console.log(`Attempting to kill processes on ports: ${portsToKill.join(', ')}`);

// For each port, find the PID and kill it
portsToKill.forEach(port => {
  // Step 1: Find PID using netstat
  const findPidCommand = `netstat -ano | findstr :${port} | findstr LISTENING`;
  
  console.log(`Running command: ${findPidCommand}`);
  
  exec(findPidCommand, (error, stdout, stderr) => {
    if (error) {
      console.log(`No process found listening on port ${port}`);
      return;
    }
    
    if (!stdout || !stdout.trim()) {
      console.log(`No process found listening on port ${port}`);
      return;
    }
    
    // Parse the output to get the PID
    const lines = stdout.trim().split('\n');
    if (lines.length === 0) {
      console.log(`No process found listening on port ${port}`);
      return;
    }
    
    try {
      // Get the PID (last column)
      const firstLine = lines[0].trim();
      const columns = firstLine.split(/\s+/);
      const pid = columns[columns.length - 1];
      
      if (!pid || isNaN(parseInt(pid))) {
        console.log(`Could not extract PID for port ${port}`);
        return;
      }
      
      // Step 2: Kill the process using taskkill
      const killCommand = `taskkill /PID ${pid} /F`;
      console.log(`Running command: ${killCommand}`);
      
      exec(killCommand, (killError, killStdout, killStderr) => {
        if (killError) {
          console.error(`Error killing process ${pid} on port ${port}:`, killError.message);
          return;
        }
        
        console.log(`Successfully terminated process ${pid} on port ${port}: ${killStdout.trim()}`);
      });
    } catch (parseError) {
      console.error(`Error parsing netstat output for port ${port}:`, parseError.message);
    }
  });
});

// Give time for processes to terminate
setTimeout(() => {
  console.log('Port cleanup completed - the service should now be able to bind to one of these ports');
}, 2000); 