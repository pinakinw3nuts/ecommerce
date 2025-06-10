/**
 * Automatic Storage Synchronization System
 * 
 * This script watches the central storage directory and automatically
 * synchronizes any changes to all app public/storage directories.
 * 
 * No symbolic links required - works on all platforms without admin rights.
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

// Define paths
const rootDir = path.resolve(__dirname, '..');
const storageDir = path.join(rootDir, 'storage');

// Apps that need access to storage
const apps = [
  {
    name: 'storefront',
    path: path.join(rootDir, 'apps', 'storefront', 'public', 'storage')
  },
  {
    name: 'admin-panel',
    path: path.join(rootDir, 'apps', 'admin-panel', 'public', 'storage')
  }
];

// Storage subdirectories to monitor
const storageFolders = [
  'brands',
  'categories',
  'products',
  'banners',
  'uploads'
];

// Ensure all directories exist
console.log('Setting up storage system...');

// Create main storage directory if it doesn't exist
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
  console.log(`Created main storage directory: ${storageDir}`);
}

// Create storage subdirectories
storageFolders.forEach(folder => {
  const folderPath = path.join(storageDir, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`Created storage subdirectory: ${folder}`);
  }
});

// Create app storage directories
apps.forEach(app => {
  if (!fs.existsSync(app.path)) {
    fs.mkdirSync(app.path, { recursive: true });
    console.log(`Created app storage directory: ${app.name}`);
  }
  
  // Create subdirectories in each app
  storageFolders.forEach(folder => {
    const appFolderPath = path.join(app.path, folder);
    if (!fs.existsSync(appFolderPath)) {
      fs.mkdirSync(appFolderPath, { recursive: true });
      console.log(`Created ${folder} directory in ${app.name}`);
    }
  });
});

// Perform initial synchronization
console.log('\nPerforming initial file synchronization...');

let initialFiles = 0;
let initialDirs = 0;

// Sync all files from storage to apps
function syncAllFiles() {
  storageFolders.forEach(folder => {
    const sourceFolderPath = path.join(storageDir, folder);
    if (!fs.existsSync(sourceFolderPath)) return;
    
    // Process files in this folder
    syncFilesInFolder(sourceFolderPath, folder);
    
    // Find and process subdirectories
    function processSubdirectories(dir, relativePath) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      entries.forEach(entry => {
        if (entry.isDirectory()) {
          const subDirPath = path.join(dir, entry.name);
          const subDirRelative = path.join(relativePath, entry.name);
          
          // Create this subdirectory in all apps
          apps.forEach(app => {
            const targetSubDir = path.join(app.path, subDirRelative);
            if (!fs.existsSync(targetSubDir)) {
              fs.mkdirSync(targetSubDir, { recursive: true });
              initialDirs++;
            }
          });
          
          // Process files in this subdirectory
          syncFilesInFolder(subDirPath, subDirRelative);
          
          // Recursively process deeper subdirectories
          processSubdirectories(subDirPath, subDirRelative);
        }
      });
    }
    
    // Start subdirectory processing
    processSubdirectories(sourceFolderPath, folder);
  });
  
  console.log(`Initial sync complete: ${initialFiles} files, ${initialDirs} directories`);
}

// Helper function to sync files in a specific folder
function syncFilesInFolder(sourceFolderPath, relativePath) {
  const files = fs.readdirSync(sourceFolderPath, { withFileTypes: true });
  
  files.forEach(file => {
    if (file.isFile()) {
      const sourceFile = path.join(sourceFolderPath, file.name);
      
      // Copy to each app
      apps.forEach(app => {
        const targetFile = path.join(app.path, relativePath, file.name);
        const targetDir = path.dirname(targetFile);
        
        // Ensure target directory exists
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        try {
          fs.copyFileSync(sourceFile, targetFile);
          initialFiles++;
        } catch (err) {
          console.error(`Error copying ${sourceFile}: ${err.message}`);
        }
      });
    }
  });
}

// Run initial sync
syncAllFiles();

// Set up file watcher for real-time synchronization
console.log('\nStarting automatic file watcher...');
console.log('Any changes to the storage directory will be automatically synchronized.');
console.log('Press Ctrl+C to stop the watcher.\n');

// Initialize watcher with optimized settings
const watcher = chokidar.watch(storageDir, {
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 500,
    pollInterval: 100
  },
  ignored: /(^|[\/\\])\../, // Ignore hidden files
  depth: 10 // Monitor nested directories
});

// File event handlers
watcher
  .on('add', (filePath) => handleFileChange(filePath, 'add'))
  .on('change', (filePath) => handleFileChange(filePath, 'change'))
  .on('unlink', handleFileDelete)
  .on('addDir', handleDirCreate)
  .on('unlinkDir', handleDirDelete)
  .on('error', error => console.error(`Watcher error: ${error}`))
  .on('ready', () => console.log('File watcher initialized and ready'));

// Handle file add/change
function handleFileChange(filePath, eventType) {
  // Skip if not in storage directory
  if (!filePath.startsWith(storageDir)) return;
  
  // Get relative path from storage root
  const relativePath = path.relative(storageDir, filePath);
  
  // Skip hidden files and directories
  if (relativePath.includes('/.') || path.basename(relativePath).startsWith('.')) {
    return;
  }
  
  console.log(`[${eventType.toUpperCase()}] ${relativePath}`);
  
  // Copy to each app
  apps.forEach(app => {
    const targetFile = path.join(app.path, relativePath);
    const targetDir = path.dirname(targetFile);
    
    // Create target directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Copy the file
    try {
      fs.copyFileSync(filePath, targetFile);
      console.log(`  → Synced to ${app.name}`);
    } catch (err) {
      console.error(`  ✕ Error syncing to ${app.name}: ${err.message}`);
    }
  });
}

// Handle file delete
function handleFileDelete(filePath) {
  // Skip if not in storage directory
  if (!filePath.startsWith(storageDir)) return;
  
  // Get relative path from storage root
  const relativePath = path.relative(storageDir, filePath);
  
  // Skip hidden files and directories
  if (relativePath.includes('/.') || path.basename(relativePath).startsWith('.')) {
    return;
  }
  
  console.log(`[DELETE] ${relativePath}`);
  
  // Delete from each app
  apps.forEach(app => {
    const targetFile = path.join(app.path, relativePath);
    
    if (fs.existsSync(targetFile)) {
      try {
        fs.unlinkSync(targetFile);
        console.log(`  → Deleted from ${app.name}`);
      } catch (err) {
        console.error(`  ✕ Error deleting from ${app.name}: ${err.message}`);
      }
    }
  });
}

// Handle directory create
function handleDirCreate(dirPath) {
  // Skip if not in storage directory
  if (!dirPath.startsWith(storageDir)) return;
  
  // Get relative path from storage root
  const relativePath = path.relative(storageDir, dirPath);
  
  // Skip root directory and hidden directories
  if (!relativePath || relativePath.includes('/.') || path.basename(relativePath).startsWith('.')) {
    return;
  }
  
  console.log(`[DIR CREATE] ${relativePath}`);
  
  // Create in each app
  apps.forEach(app => {
    const targetDir = path.join(app.path, relativePath);
    
    if (!fs.existsSync(targetDir)) {
      try {
        fs.mkdirSync(targetDir, { recursive: true });
        console.log(`  → Created in ${app.name}`);
      } catch (err) {
        console.error(`  ✕ Error creating in ${app.name}: ${err.message}`);
      }
    }
  });
}

// Handle directory delete
function handleDirDelete(dirPath) {
  // Skip if not in storage directory
  if (!dirPath.startsWith(storageDir)) return;
  
  // Get relative path from storage root
  const relativePath = path.relative(storageDir, dirPath);
  
  // Skip root directory and hidden directories
  if (!relativePath || relativePath.includes('/.') || path.basename(relativePath).startsWith('.')) {
    return;
  }
  
  console.log(`[DIR DELETE] ${relativePath}`);
  
  // Delete from each app
  apps.forEach(app => {
    const targetDir = path.join(app.path, relativePath);
    
    if (fs.existsSync(targetDir)) {
      try {
        fs.rmdirSync(targetDir, { recursive: true });
        console.log(`  → Deleted from ${app.name}`);
      } catch (err) {
        console.error(`  ✕ Error deleting from ${app.name}: ${err.message}`);
      }
    }
  });
} 