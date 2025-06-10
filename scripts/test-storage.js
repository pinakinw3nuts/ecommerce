/**
 * Storage Sync Test Script
 * 
 * This script creates a sample test image in the storage directory
 * to demonstrate the automatic synchronization system.
 */

const fs = require('fs');
const path = require('path');

// Define paths
const rootDir = path.resolve(__dirname, '..');
const storageDir = path.join(rootDir, 'storage');

// Generate a simple test image (1x1 pixel transparent PNG)
const transparentPixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEhgJAni7NYwAAAABJRU5ErkJggg==', 'base64');

// Create timestamp for unique filenames
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

// Create test files in each storage folder
const folders = ['brands', 'categories', 'products', 'banners', 'uploads'];

console.log('Creating test files to demonstrate storage sync...\n');

// Ensure the storage directory exists
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

// Create a file in each folder
folders.forEach(folder => {
  const folderPath = path.join(storageDir, folder);
  
  // Create folder if it doesn't exist
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`Created folder: ${folder}`);
  }
  
  // Create test file
  const filename = `test-${folder}-${timestamp}.png`;
  const filePath = path.join(folderPath, filename);
  
  try {
    fs.writeFileSync(filePath, transparentPixel);
    console.log(`✅ Created test file: ${folder}/${filename}`);
  } catch (error) {
    console.error(`❌ Error creating test file in ${folder}: ${error.message}`);
  }
});

// Create a nested folder test
const nestedFolder = path.join(storageDir, 'products', `nested-test-${timestamp}`);
if (!fs.existsSync(nestedFolder)) {
  fs.mkdirSync(nestedFolder, { recursive: true });
  console.log(`Created nested folder: products/nested-test-${timestamp}`);
}

// Create test file in nested folder
const nestedFilename = `nested-product-${timestamp}.png`;
const nestedFilePath = path.join(nestedFolder, nestedFilename);
try {
  fs.writeFileSync(nestedFilePath, transparentPixel);
  console.log(`✅ Created nested test file: products/nested-test-${timestamp}/${nestedFilename}`);
} catch (error) {
  console.error(`❌ Error creating nested test file: ${error.message}`);
}

console.log('\nTest files created successfully!');
console.log('\nIf storage sync is running (npm run storage:sync), these files should be');
console.log('automatically synchronized to all app storage directories.');
console.log('\nCheck the following locations to confirm synchronization:');
console.log('- apps/storefront/public/storage/');
console.log('- apps/admin-panel/public/storage/');

// Wait 2 seconds before exit to allow sync to complete
console.log('\nWaiting for sync to complete...');
setTimeout(() => {
  console.log('Done!');
}, 2000); 