/**
 * Windows Service Uninstaller for Storage Sync
 * 
 * This script uninstalls the storage sync Windows service.
 */

const Service = require('node-windows').Service;
const path = require('path');

const scriptPath = path.join(__dirname, 'storage-sync.js');

// Create a new service object
const svc = new Service({
  name: 'Storage Sync Service',
  script: scriptPath
});

// Listen for uninstall event
svc.on('uninstall', () => {
  console.log('Service uninstalled successfully');
});

svc.on('error', (err) => {
  console.error('Error during service uninstallation:', err);
});

// Uninstall the service
console.log('Uninstalling storage sync service...');
svc.uninstall(); 