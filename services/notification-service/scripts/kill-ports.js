/**
 * Script to kill processes running on ports used by the notification service
 */
const { exec } = require('child_process');
const { platform } = require('os');

const portsToKill = [3014, 3030, 3031, 3032, 3033, 3034, 3035, 3036, 3037, 3038, 3039];

// Different commands for different platforms
const killCommands = {
  win32: (port) => `FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :${port} ^| findstr LISTENING') DO TaskKill /PID %%P /F`,
  darwin: (port) => `lsof -i :${port} -sTCP:LISTEN | awk 'NR > 1 {print $2}' | xargs -r kill -9`,
  linux: (port) => `lsof -i :${port} -sTCP:LISTEN | awk 'NR > 1 {print $2}' | xargs -r kill -9`,
};

const currentPlatform = platform();
const killCommand = killCommands[currentPlatform] || killCommands.linux;

console.log(`Attempting to kill processes on ports: ${portsToKill.join(', ')}`);

// Kill each port one by one
portsToKill.forEach(port => {
  const command = killCommand(port);
  
  console.log(`Running command: ${command}`);
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      // Don't consider it an error if there was no process to kill
      if (error.message.includes('No such process') || 
          error.message.includes('not found') ||
          error.message.includes('No tasks') ||
          error.message.includes('0 process')) {
        console.log(`No process found on port ${port}`);
        return;
      }
      
      console.error(`Error killing process on port ${port}:`, error.message);
      return;
    }
    
    if (stderr) {
      console.error(`Error output for port ${port}:`, stderr);
      return;
    }
    
    if (stdout && stdout.trim()) {
      console.log(`Successfully terminated process on port ${port}: ${stdout.trim()}`);
    } else {
      console.log(`No active process found on port ${port}`);
    }
  });
});

// Give time for processes to terminate
setTimeout(() => {
  console.log('Port cleanup completed - the service should now be able to bind to one of these ports');
}, 1000); 