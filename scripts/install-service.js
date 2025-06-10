/**
 * Windows Service Installer for Storage Sync
 * 
 * This script installs the storage-sync.js as a Windows service
 * so it runs automatically in the background.
 */

const Service = require('node-windows').Service;
const path = require('path');

const scriptPath = path.join(__dirname, 'storage-sync.js');

// Create a new service object
const svc = new Service({
  name: 'Storage Sync Service',
  description: 'Automatically synchronizes files between storage and app directories',
  script: scriptPath,
  nodeOptions: [],
  workingDirectory: path.resolve(__dirname, '..'),
  allowServiceLogon: true
});

// Listen for service events
svc.on('install', () => {
  console.log('Service installed successfully');
  console.log('Starting service...');
  svc.start();
});

svc.on('start', () => {
  console.log('Service started successfully');
  console.log('Storage sync is now running in the background');
});

svc.on('alreadyinstalled', () => {
  console.log('Service is already installed');
});

svc.on('error', (err) => {
  console.error('Error during service installation:', err);
});

// Install the service
console.log('Installing storage sync service...');
svc.install(); 